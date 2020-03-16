import * as React from 'react';
import { album, GalleryView } from './galleryView/galleryView';
import { picture, PictureView } from './pictureView/pictureView';
import { CloseOutlined } from '@ant-design/icons';
import style from './mainView.scss';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { ServiceCollection } from '@/common/serviceCollection';
import { remote, ipcRenderer } from 'electron';
import { serviceConstant } from '@/common/constant/service.constant';
import { FileService } from '@/main/services/file.service';
import { extractDirNameFromUrl } from '@/common/utils';
import { command } from '@/common/constant/command.constant';

export interface IMainViewProps {}

export interface IMainViewState {
    pages: page[];
    currentPage: page['id'];
}

export type page = {
    id: string | number;
    title: string;
    type: 'gallery' | 'picture';
    data: album[] | picture[];
};

export type requestPictureData = {
    id: string | number;
    title: string;
    type: 'gallery' | 'picture';
    url: string;
};

export class MainView extends React.PureComponent<IMainViewProps, IMainViewState> {
    constructor(props: IMainViewProps) {
        super(props);
        this.state = {
            pages: [],
            currentPage: null
        };
        this.initIpc();
        this.initEvent();
    }

    initIpc() {
        ipcRenderer.on(command.RECEIVE_PICTURE, (event, data: { id: string | number; pictureData: picture[] }) => {
            const targetPageIndex = this.state.pages.findIndex(page => page.id === data.id);
            const targetPage = this.state.pages[targetPageIndex];
            const concatedData: picture[] = targetPage.data.concat(data.pictureData);

            const newPages = [...this.state.pages];
            newPages[targetPageIndex].data = concatedData;

            this.setState({
                pages: newPages
            });
        });
    }

    initEvent() {
        EventHub.on(eventConstant.LOAD_PICTURE_BY_SELECT_DIR, (data: { url: string; type: 'NEW' | 'REPLACE' }) => {
            const { url, type } = data;
            if (type === 'NEW') {
                this.setState({
                    currentPage: url
                });
                if (this.state.pages.findIndex(pageInState => pageInState.id === url) !== -1) return;

                const newTabData: page = {
                    id: url,
                    title: extractDirNameFromUrl(url),
                    type: 'picture',
                    data: [] as picture[]
                };

                this.setState({
                    pages: [...this.state.pages, newTabData]
                });

                const { data, ...sendData } = { ...newTabData, url };
                ipcRenderer.send(command.SELECT_DIR_IN_TREE, sendData as requestPictureData);
            }
        });
    }

    switchTab(id: string | number) {
        this.setState({
            currentPage: id
        });
    }

    render(): JSX.Element {
        const Tabs = this.state.pages.map(page => {
            const isSelected = this.state.currentPage === page.id;
            return (
                <div className={`${style.tabsItem} ${isSelected ? style.isSelected : ''}`} key={page.id} onClick={() => this.switchTab(page.id)}>
                    <div className={`${style.left} text-ellipsis-1`}>{page.title}</div>
                    <div className={style.right}>
                        <CloseOutlined />
                    </div>
                </div>
            );
        });

        const page = this.state.pages.find(page => page.id === this.state.currentPage);

        const DisplayArea = page?.data && (
            <div className={`${style.displayArea} medium-scrollbar`}>
                {page?.type === 'gallery' ? <GalleryView /> : <PictureView album={page.data} />}
            </div>
        );

        return (
            <div className={`${style.mainView} medium-scrollbar`}>
                <div className={`${style.tabsWrapper} no-scrollbar`}>{Tabs}</div>
                {DisplayArea}
            </div>
        );
    }
}
