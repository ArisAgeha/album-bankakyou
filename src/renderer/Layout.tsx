import * as React from 'react';
import { FileBar } from './parts/fileBar/fileBar';
import { MainView } from './parts/mainView/mainView';
import { ManageBar } from './parts/manageBar/manageBar';
import style from './Layout.scss';
import { Event, app, remote } from 'electron';
import { ConfigurationService } from '@/main/services/configuration.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { workbenchConfig } from '@/common/constant/config.constant';

interface ILayoutState {
    fileBarWidth: number;
    fileBarIsShow: boolean;
    manageBarHeight: number;
    manageBarIsShow: boolean;
    fileBarCanDrag: boolean;
    manageBarCanDrag: boolean;
    isDragging: boolean;
}

class Layout extends React.Component<any, ILayoutState> {
    private readonly layoutRef: React.RefObject<HTMLDivElement>;
    private readonly configurationService: ConfigurationService;

    constructor(props: any) {
        super(props);
        this.layoutRef = React.createRef();

        const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;
        this.configurationService = serviceCollection.get('configurationService');

        this.init();
    }

    init(): void {
        const state = {
            fileBarWidth: 300,
            fileBarIsShow: true,
            manageBarHeight: 200,
            manageBarIsShow: true,
            fileBarCanDrag: false,
            manageBarCanDrag: false,
            isDragging: false
        };

        state.fileBarWidth = this.configurationService.getValue('workbench', workbenchConfig.FILE_BAR_WIDTH) as number;
        state.manageBarHeight = this.configurationService.getValue('workbench', workbenchConfig.MANAGE_BAR_HEIGHT) as number;

        this.state = state;
    }

    handleMouseMove(e: React.MouseEvent) {
        let fileBarWidth = this.state.fileBarWidth;
        let manageBarHeight = this.state.manageBarHeight;
        if (this.state.isDragging) {
            if (this.state.fileBarCanDrag) fileBarWidth += e.movementX;
            if (this.state.manageBarCanDrag) manageBarHeight += -e.movementY;
            this.configurationService.upadteUserConfig([
                { id: 'workbench', key: workbenchConfig.FILE_BAR_WIDTH, value: fileBarWidth },
                { id: 'workbench', key: workbenchConfig.MANAGE_BAR_HEIGHT, value: manageBarHeight }
            ]);
        }

        let fileBarCanDrag: boolean = this.state.fileBarCanDrag;
        let manageBarCanDrag: boolean = this.state.manageBarCanDrag;

        if (!this.state.isDragging) {
            fileBarCanDrag = Math.abs(e.clientX - this.state.fileBarWidth) < 5 ? true : false;
            manageBarCanDrag = Math.abs(this.layoutRef.current.clientHeight - this.state.manageBarHeight - e.clientY) < 5 ? true : false;
        }

        this.setState({
            fileBarCanDrag,
            manageBarCanDrag,
            fileBarWidth,
            manageBarHeight
        });
    }

    startDrag(e: React.MouseEvent) {
        this.setState({
            isDragging: true
        });
    }

    stopDrag(e: React.MouseEvent) {
        this.setState({
            isDragging: false
        });
    }

    getCursorStyle(): string {
        let cursor = 'default';
        if (this.state.fileBarCanDrag && this.state.manageBarCanDrag) cursor = 'nesw-resize';
        else if (this.state.fileBarCanDrag) cursor = 'e-resize';
        else if (this.state.manageBarCanDrag) cursor = 'n-resize';
        else cursor = 'default';
        return cursor;
    }

    render(): JSX.Element {
        const cursor: string = this.getCursorStyle();

        const layoutStyle: React.CSSProperties = { cursor, height: '100%', width: '100%', display: 'flex' };
        const fileBarStyle: React.CSSProperties = { width: this.state.fileBarWidth, backgroundColor: 'rgb(51, 51, 51)', height: '100%' };
        const manageBarStyle: React.CSSProperties = { height: this.state.manageBarHeight, width: '100%', backgroundColor: 'rgb(65, 65, 65)' };

        return (
            <div
                ref={this.layoutRef}
                className='layout'
                style={layoutStyle}
                onMouseMove={this.handleMouseMove.bind(this)}
                onMouseDown={this.startDrag.bind(this)}
                onMouseUp={this.stopDrag.bind(this)}
            >
                <div className='left' style={{ height: '100vh' }}>
                    <div className='grid-fileBar' style={fileBarStyle}>
                        <FileBar></FileBar>
                    </div>
                </div>

                <div className='right' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className='grid-mainView' style={{ flex: 1, backgroundColor: 'rgb(30, 30, 30)' }}>
                        <MainView></MainView>
                    </div>

                    <div className='grid-manageBar' style={manageBarStyle}>
                        <ManageBar></ManageBar>
                    </div>
                </div>
            </div>
        );
    }
}

export { Layout };
