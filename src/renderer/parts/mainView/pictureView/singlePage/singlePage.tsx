import * as React from 'react';
import style from './singlePage.scss';
import { page } from '../../mainView';
import { picture } from '../pictureView';
import { isNumber } from '@/common/types';

export interface ISinglePageState {}

export interface ISinglePageProps {
    page: page;
    currentShowIndex: number;
    onSwitchPage(e: ISwitchPageEvent): void;
}

export interface ISwitchPageEvent {
    delta?: number;
    goto?: number;
}

export class SinglePage extends React.PureComponent<ISinglePageProps, ISinglePageState> {
    input: string;

    constructor(props: ISinglePageProps) {
        super(props);

        this.state = {};
        this.input = '';
    }

    handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0) this.props.onSwitchPage({delta: 1});
        else if (e.deltaY < 0) this.props.onSwitchPage({delta: -1});
    }

    handleKeydown = (e: React.KeyboardEvent) => {
        console.log(e.key);
        if (e.key === 'ArrowRight') this.props.onSwitchPage({delta: 1});
        else if (e.key === 'ArrowLeft') this.props.onSwitchPage({delta: -1});
        else if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(Number(e.key))) {
            this.input += e.key;
        }
        else if (e.key === 'Enter') {
            const nextPage = Number(this.input);
            if (!isNumber(nextPage)) return;
            this.input = '';
            this.props.onSwitchPage({goto: nextPage});
        }
    }

    render(): JSX.Element {
        const imgSrc = (this.props.page.data as picture[])[this.props.currentShowIndex].url;

        return <div className={style.singlePageWrapper} onWheel={this.handleWheel} onKeyDown={this.handleKeydown} tabIndex={3}>
            <img src={imgSrc} alt=''/>
        </div>;
    }
}
