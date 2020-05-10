import React, { Component, SetStateAction, PureComponent } from 'react';
import style from './infoBar.scss';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { openNotification } from '@/renderer/utils/tools';
import { withTranslation, WithTranslation } from 'react-i18next';
import { CopyOutlined, CopyFilled } from '@ant-design/icons';

export interface IInfoBarProps extends WithTranslation { }

export interface IInfoBarState {
    mainText: string;
    text: textObj[];
}

export type textObj = {
    text: string;
    color?: React.CSSProperties['color'];
};

class InfoBar extends PureComponent<IInfoBarProps & WithTranslation, IInfoBarState> {
    constructor(props: IInfoBarProps) {
        super(props);

        this.state = {
            text: [],
            mainText: ''
        };
    }

    componentDidMount() {
        this.initEvent();
    }

    componentWillUnmount() {
        this.removeEvent();
    }

    initEvent = () => {
        EventHub.on(eventConstant.HINT_TEXT, this.changeText);
        EventHub.on(eventConstant.HINT_MAIN_TEXT, this.changeMainText);

        window.addEventListener('keydown', this.copyByKeydown);
    }

    removeEvent = () => {
        EventHub.cancel(eventConstant.HINT_TEXT, this.changeText);
        window.removeEventListener('keydown', this.copyByKeydown);
    }

    copyByKeydown = (e: KeyboardEvent) => {
        const t = this.props.t;
        if (e.ctrlKey && e.key.toLowerCase() === 'c') navigator.clipboard.writeText(this.state.mainText);
        openNotification(t('%copySuccessfully%'), this.state.mainText);
    }

    copyByButton = () => {
        const t = this.props.t;
        navigator.clipboard.writeText(this.state.mainText);
        openNotification(t('%copySuccessfully%'), t('%copyDesc%'), {
            duration: 4.5
        });
    }

    changeText = (text: textObj[]) => {
        this.setState({
            text
        });
    }

    changeMainText = (mainText: string) => {
        this.setState({
            mainText
        });
    }

    render(): JSX.Element {
        return <div className={style.infoWrapper}>
            <div className={style.left}>
                {this.state.mainText}
                {this.state.mainText && <CopyFilled style={{ marginLeft: '12px', cursor: 'pointer' }} onClick={this.copyByButton} />}
            </div>
            <div className={style.right}>
                {
                    this.state.text.map((obj, index) => (<span
                        className={style.text}
                        style={{ color: obj.color || '#fff' }}
                        key={index}>{obj.text}
                    </span>))
                }
            </div>
        </div>;
    }
}

const infobar = withTranslation()(InfoBar);
export { infobar as InfoBar };