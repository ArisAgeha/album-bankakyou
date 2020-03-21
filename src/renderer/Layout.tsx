import * as React from 'react';
import { FileBar, fileBarViewType } from './parts/fileBar/fileBar';
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
import { serviceConstant } from '@/common/constant/service.constant';
import { isUndefinedOrNull } from '@/common/types';

interface ILayoutState {
    fileBarIsShow: boolean;
    manageBarIsShow: boolean;
    fileBarCanDrag: boolean;
    manageBarCanDrag: boolean;
    toolsBarWidth: number;
    infoBarHeight: number;
    filebarShowView: fileBarViewType;
}

interface ILayoutValue {
    eventHandler: any;
    hasListener: boolean;
    isDragging: boolean;
    fileBarWidth: number;
    manageBarHeight: number;
}

class Layout extends React.PureComponent<any, ILayoutState> {
    private readonly layoutRef: React.RefObject<HTMLDivElement>;
    private readonly fileBarRef: React.RefObject<HTMLDivElement>;
    private readonly manageBarRef: React.RefObject<HTMLDivElement>;
    private readonly configurationService: ConfigurationService;
    private layoutValue: ILayoutValue;

    constructor(props: any) {
        super(props);
        this.layoutRef = React.createRef();
        this.fileBarRef = React.createRef();
        this.manageBarRef = React.createRef();

        const serviceCollection: ServiceCollection = remote.getGlobal(serviceConstant.SERVICE_COLLECTION);
        this.configurationService = serviceCollection.get(serviceConstant.CONFIGURATION);

        this.init();
    }

    // insize

    private init(): void {
        // init state
        const state: ILayoutState = {
            fileBarIsShow: true,
            manageBarIsShow: true,
            fileBarCanDrag: false,
            manageBarCanDrag: false,
            toolsBarWidth: 50,
            infoBarHeight: 22,
            filebarShowView: 'directory'
        };

        state.fileBarIsShow = this.configurationService.getValue('workbench', workbenchConfig.FILEBAR_SHOW) as boolean;
        state.manageBarIsShow = this.configurationService.getValue('workbench', workbenchConfig.MANAGEBAR_SHOW) as boolean;

        this.state = state;

        // init layoutValue
        this.layoutValue = {
            eventHandler: null,
            hasListener: false,
            isDragging: false,
            fileBarWidth: this.configurationService.getValue('workbench', workbenchConfig.FILEBAR_WIDTH) as number,
            manageBarHeight: this.configurationService.getValue('workbench', workbenchConfig.MANAGEBAR_HEIGHT) as number
        };

        // init stop drag handler
        this.layoutValue.eventHandler = this.stopDrag.bind(this);
    }

    private stopDrag() {
        this.layoutValue.isDragging = false;
    }

    @throttle(15, { isEvent: true })
    private handleMouseMove(e: React.MouseEvent) {
        let fileBarWidth = this.layoutValue.fileBarWidth;
        let fileBarIsShow = this.state.fileBarIsShow;
        let manageBarHeight = this.layoutValue.manageBarHeight;
        let manageBarIsShow = this.state.manageBarIsShow;

        // while is dragging, compute and set the width/height of the bar which is dragging
        if (this.layoutValue.isDragging) {
            if (!this.layoutValue.hasListener) {
                this.layoutValue.hasListener = true;
                document.addEventListener('mouseup', this.layoutValue.eventHandler, true);
            }
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

            this.updateToFile({ fileBarWidth, fileBarIsShow, manageBarHeight, manageBarIsShow });
        }

        // while is not dragging, check if bar could drag
        let fileBarCanDrag: boolean = this.state.fileBarCanDrag;
        let manageBarCanDrag: boolean = this.state.manageBarCanDrag;

        if (!this.layoutValue.isDragging) {
            fileBarCanDrag = this.state.fileBarIsShow
                ? Math.abs(e.clientX - this.state.toolsBarWidth - this.layoutValue.fileBarWidth) < 5
                : Math.abs(e.clientX - this.state.toolsBarWidth) < 5;

            manageBarCanDrag = this.state.manageBarIsShow
                ? Math.abs(this.layoutRef.current.clientHeight - this.layoutValue.manageBarHeight - this.state.infoBarHeight - e.clientY) < 5
                : Math.abs(this.layoutRef.current.clientHeight - this.state.infoBarHeight - e.clientY) < 5;
        }

        // finally
        const setStateObj: any = {
            fileBarCanDrag: fileBarCanDrag !== this.state.fileBarCanDrag ? fileBarCanDrag : undefined,
            manageBarCanDrag: manageBarCanDrag !== this.state.manageBarCanDrag ? manageBarCanDrag : undefined,
            fileBarIsShow: fileBarIsShow !== this.state.fileBarIsShow ? fileBarIsShow : undefined,
            manageBarIsShow: manageBarIsShow !== this.state.manageBarIsShow ? manageBarIsShow : undefined
        };

        Object.entries(setStateObj).forEach(item => {
            const key = item[0];
            const val = item[1];
            if (isUndefinedOrNull(val)) delete setStateObj[key];
        });

        this.layoutValue.fileBarWidth = fileBarWidth;
        this.layoutValue.manageBarHeight = manageBarHeight;
        this.fileBarRef.current.style.width = `${fileBarWidth}px`;
        this.manageBarRef.current.style.height = `${manageBarHeight}px`;

        if (Object.values(setStateObj).length !== 0) this.setState(setStateObj);
    }

    updateToFile(updateObj: { fileBarWidth: number; fileBarIsShow: boolean; manageBarHeight: number; manageBarIsShow: boolean }) {
        const { fileBarWidth, fileBarIsShow, manageBarHeight, manageBarIsShow } = updateObj;

        const shouldUpdateObj = [];

        if (fileBarWidth !== this.layoutValue.fileBarWidth)
            shouldUpdateObj.push({ id: 'workbench', key: workbenchConfig.FILEBAR_WIDTH, value: fileBarWidth });
        if (fileBarIsShow !== this.state.fileBarIsShow)
            shouldUpdateObj.push({ id: 'workbench', key: workbenchConfig.FILEBAR_SHOW, value: fileBarIsShow });
        if (manageBarHeight !== this.layoutValue.manageBarHeight)
            shouldUpdateObj.push({ id: 'workbench', key: workbenchConfig.MANAGEBAR_HEIGHT, value: manageBarHeight });
        if (manageBarIsShow !== this.state.manageBarIsShow)
            shouldUpdateObj.push({ id: 'workbench', key: workbenchConfig.MANAGEBAR_SHOW, value: manageBarIsShow });

        this.configurationService.upadteUserConfig(shouldUpdateObj);
    }

    private startDrag(e: React.MouseEvent) {
        this.layoutValue.isDragging = true;
    }

    private getCursorStyle(): string {
        let cursor = 'default';
        if (this.state.fileBarCanDrag && this.state.manageBarCanDrag) cursor = 'nesw-resize';
        else if (this.state.fileBarCanDrag) cursor = 'e-resize';
        else if (this.state.manageBarCanDrag) cursor = 'n-resize';
        else cursor = 'default';
        return cursor;
    }

    showColelctionView() {
        this.setState({
            filebarShowView: 'collection'
        });
    }

    changeFilebarView = (view: fileBarViewType) => {
        this.setState({
            filebarShowView: view
        });
    }

    render(): JSX.Element {
        const cursor: string = this.getCursorStyle();

        const layoutStyle: React.CSSProperties = { cursor };
        const fileBarStyle: React.CSSProperties = { width: this.layoutValue.fileBarWidth, display: this.state.fileBarIsShow ? 'block' : 'none' };
        const manageBarStyle: React.CSSProperties = {
            height: this.layoutValue.manageBarHeight,
            display: this.state.manageBarIsShow ? 'block' : 'none'
        };

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
                            <ToolsBar toolsBarWidth={this.state.toolsBarWidth} changeFilebarView={this.changeFilebarView}></ToolsBar>
                        </div>
                        <div className={style.gridFileBar} style={fileBarStyle} ref={this.fileBarRef}>
                            <FileBar showView={this.state.filebarShowView}></FileBar>
                        </div>
                    </div>

                    <div className={style.right}>
                        <div className={style.gridMainView}>
                            <MainView></MainView>
                        </div>

                        <div className={style.gridManageBar} style={manageBarStyle} ref={this.manageBarRef}>
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
