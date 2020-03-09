import * as React from 'react';
import { FileBar } from './parts/fileBar/fileBar';
import { MainView } from './parts/mainView/mainView';
import { ManageBar } from './parts/manageBar/manageBar';
import { ToolsBar } from './parts/toolsBar/toolsBar';
import { InfoBar } from './parts/infoBar/infoBar';
import style from './Layout.scss';
import { Event, app, remote } from 'electron';
import { ConfigurationService } from '@/main/services/configuration.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { workbenchConfig } from '@/common/constant/config.constant';
import { debounce, throttle } from '@/common/decorator/decorator';
import 'reflect-metadata';
import { FileService } from '@/main/services/file.service';
import { ChokidarService } from '@/main/services/chokidar.service';

interface ILayoutState {
    fileBarWidth: number;
    fileBarIsShow: boolean;
    manageBarHeight: number;
    manageBarIsShow: boolean;
    fileBarCanDrag: boolean;
    manageBarCanDrag: boolean;
    toolsBarWidth: number;
    infoBarHeight: number;
}

interface IConstant {
    eventHandler: any;
    isDragging: boolean;
}

class Layout extends React.Component<any, ILayoutState> {
    private readonly layoutRef: React.RefObject<HTMLDivElement>;
    private readonly configurationService: ConfigurationService;
    private constant: IConstant;

    constructor(props: any) {
        super(props);
        this.layoutRef = React.createRef();

        const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;
        this.configurationService = serviceCollection.get('configurationService');

        this.init();
    }

    // insize

    private init(): void {
        // init state
        const state: ILayoutState = {
            fileBarWidth: 300,
            fileBarIsShow: true,
            manageBarHeight: 200,
            manageBarIsShow: true,
            fileBarCanDrag: false,
            manageBarCanDrag: false,
            toolsBarWidth: 50,
            infoBarHeight: 22
        };

        state.fileBarWidth = this.configurationService.getValue('workbench', workbenchConfig.FILEBAR_WIDTH) as number;
        state.manageBarHeight = this.configurationService.getValue('workbench', workbenchConfig.MANAGEBAR_HEIGHT) as number;
        state.fileBarIsShow = this.configurationService.getValue('workbench', workbenchConfig.FILEBAR_SHOW) as boolean;
        state.manageBarIsShow = this.configurationService.getValue('workbench', workbenchConfig.MANAGEBAR_SHOW) as boolean;

        this.state = state;

        // init constant
        this.constant = {
            eventHandler: null,
            isDragging: false
        };

        // init stop drag handler
        this.constant.eventHandler = this.stopDrag.bind(this);
    }

    private stopDrag() {
        this.constant.isDragging = false;
    }

    @throttle(15, { isEvent: true })
    private handleMouseMove(e: React.MouseEvent) {
        let fileBarWidth = this.state.fileBarWidth;
        let fileBarIsShow = this.state.fileBarIsShow;
        let manageBarHeight = this.state.manageBarHeight;
        let manageBarIsShow = this.state.manageBarIsShow;

        // while is dragging, compute and set the width/height of the bar which is dragging
        if (this.constant.isDragging) {
            document.removeEventListener('mouseup', this.constant.eventHandler);
            document.addEventListener('mouseup', this.constant.eventHandler, true);
            if (this.state.fileBarCanDrag) {
                const computedWidth = e.clientX - this.state.toolsBarWidth;
                const distanceFromCursorToClientRight = this.layoutRef.current.clientWidth - e.clientX;
                fileBarWidth =
                    computedWidth <= 200
                        ? 200
                        : distanceFromCursorToClientRight <= 200
                        ? this.layoutRef.current.clientWidth - this.state.toolsBarWidth - 200
                        : computedWidth;
                fileBarIsShow = computedWidth <= 100 ? false : true;
            }

            if (this.state.manageBarCanDrag) {
                const height = this.layoutRef.current.clientHeight - this.state.infoBarHeight - e.clientY;
                manageBarHeight = height <= 150 ? 150 : height;
                manageBarIsShow = height <= 100 ? false : true;
            }

            this.configurationService.upadteUserConfig([
                { id: 'workbench', key: workbenchConfig.FILEBAR_WIDTH, value: fileBarWidth },
                { id: 'workbench', key: workbenchConfig.FILEBAR_SHOW, value: fileBarIsShow },
                { id: 'workbench', key: workbenchConfig.MANAGEBAR_HEIGHT, value: manageBarHeight },
                { id: 'workbench', key: workbenchConfig.MANAGEBAR_SHOW, value: manageBarIsShow }
            ]);
        }

        // while is not dragging, check if bar could drag
        let fileBarCanDrag: boolean = this.state.fileBarCanDrag;
        let manageBarCanDrag: boolean = this.state.manageBarCanDrag;

        if (!this.constant.isDragging) {
            fileBarCanDrag = this.state.fileBarIsShow
                ? Math.abs(e.clientX - this.state.toolsBarWidth - this.state.fileBarWidth) < 5
                : Math.abs(e.clientX - this.state.toolsBarWidth) < 5;

            manageBarCanDrag = this.state.manageBarIsShow
                ? Math.abs(this.layoutRef.current.clientHeight - this.state.manageBarHeight - this.state.infoBarHeight - e.clientY) < 5
                : Math.abs(this.layoutRef.current.clientHeight - this.state.infoBarHeight - e.clientY) < 5;
        }

        // finally
        if (
            fileBarCanDrag !== this.state.fileBarCanDrag ||
            manageBarCanDrag !== this.state.manageBarCanDrag ||
            fileBarWidth !== this.state.fileBarWidth ||
            manageBarHeight !== this.state.manageBarHeight ||
            fileBarIsShow !== this.state.fileBarIsShow ||
            manageBarIsShow !== this.state.manageBarIsShow
        ) {
            this.setState({
                fileBarCanDrag,
                manageBarCanDrag,
                fileBarWidth,
                manageBarHeight,
                fileBarIsShow,
                manageBarIsShow
            });
        }
    }

    private startDrag(e: React.MouseEvent) {
        this.constant.isDragging = true;
    }

    private getCursorStyle(): string {
        let cursor = 'default';
        if (this.state.fileBarCanDrag && this.state.manageBarCanDrag) cursor = 'nesw-resize';
        else if (this.state.fileBarCanDrag) cursor = 'e-resize';
        else if (this.state.manageBarCanDrag) cursor = 'n-resize';
        else cursor = 'default';
        return cursor;
    }

    render(): JSX.Element {
        const cursor: string = this.getCursorStyle();

        const layoutStyle: React.CSSProperties = { cursor };
        const fileBarStyle: React.CSSProperties = { width: this.state.fileBarWidth, display: this.state.fileBarIsShow ? 'block' : 'none' };
        const manageBarStyle: React.CSSProperties = { height: this.state.manageBarHeight, display: this.state.manageBarIsShow ? 'block' : 'none' };

        return (
            <div
                ref={this.layoutRef}
                className={style.layout}
                style={layoutStyle}
                onMouseMove={this.handleMouseMove.bind(this)}
                onMouseDown={this.startDrag.bind(this)}
            >
                <div className={style.body}>
                    <div className={style.left}>
                        <div className={style.toolsBar} style={{ width: this.state.toolsBarWidth }}>
                            <ToolsBar toolsBarWidth={this.state.toolsBarWidth}></ToolsBar>
                        </div>
                        <div className={style.gridFileBar} style={fileBarStyle}>
                            <FileBar></FileBar>
                        </div>
                    </div>

                    <div className={style.right}>
                        <div className={style.gridMainView}>
                            <MainView></MainView>
                        </div>

                        <div className={style.gridManageBar} style={manageBarStyle}>
                            <ManageBar></ManageBar>
                        </div>
                    </div>
                </div>

                <div className={style.footer} style={{ height: this.state.infoBarHeight }}>
                    <InfoBar></InfoBar>
                </div>
            </div>
        );
    }
}

export { Layout };
