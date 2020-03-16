import * as React from 'react';
import style from './pictureView.scss';
import LazyLoad from 'react-lazyload';
import { ScrollList } from './scrollList/scrollList';
import { Preview } from './preview/preview';
import { SinglePage } from './singlePage/singlePage';
import { DoublePage } from './doublePage/doublePage';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';

export type picture = {
    title: string;
    url: string;
    id: string | number;
};

export interface IPictureViewState {
    viewMode: 'preview' | 'scroll_list' | 'single_page' | 'double_page';
    currentShowIndex: number;
    size: {
        preview: number;
        scroll_list: number;
        double_page: number;
    };
}

export interface IPictureViewProps {
    album: picture[];
}

export class PictureView extends React.PureComponent<IPictureViewProps, IPictureViewState> {
    constructor(props: IPictureViewProps) {
        super(props);

        this.state = {
            viewMode: 'preview',
            currentShowIndex: 0,
            size: {
                preview: 1 / 6,
                scroll_list: 0.6,
                double_page: 1
            }
        };

        this.initEvent();
    }

    initEvent() {
        EventHub.on(eventConstant.SWITCH_PICTURE_MODE, (mode: IPictureViewState['viewMode']) => {
            this.setState({
                viewMode: mode
            });
        });
    }

    handleDoubleClickPreview(e: React.MouseEvent, data: any) {
        const { currentShowIndex } = data;
        this.setState({
            currentShowIndex,
            viewMode: 'single_page'
        });
    }

    render(): JSX.Element {
        let Album = null;

        switch (this.state.viewMode) {
            case 'preview':
                Album = (
                    <Preview
                        album={this.props.album}
                        onDbClick={(e: React.MouseEvent, data: any) => {
                            this.handleDoubleClickPreview(e, data);
                        }}
                    />
                );
                break;

            case 'scroll_list':
                Album = <ScrollList />;
                break;

            case 'single_page':
                Album = <SinglePage />;
                break;

            case 'double_page':
                Album = <DoublePage />;
                break;

            default:
                Album = <ScrollList />;
        }

        return <div className={style.pictureViewWrapper}>{Album}</div>;
    }
}
