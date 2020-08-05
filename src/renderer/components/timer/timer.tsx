import React, { PureComponent } from 'react';
import style from './timer.scss';
import { WithTranslation, withTranslation } from 'react-i18next';
import { PlayCircleOutlined, PauseCircleOutlined, ForwardOutlined, FormOutlined, LineChartOutlined } from '@ant-design/icons';
import { ConfigurationService } from '@/main/services/configuration.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { remote } from 'electron';
import { serviceConstant } from '@/common/constant/service.constant';

type Duration = number;

export type PlayList = Array<{
    itemName: string;
    duration?: Duration;
}>;

export interface ITimerProps extends WithTranslation {
    show: boolean;
    AscPlayFunc: Function;
    DescPlayFunc: Function;
    playList: PlayList;
    globalDuration?: number;
    currentIndex: number;
}

export interface ITimerState {
    isPause: boolean;
    remainingTime: number;
    playMode: 'balance' | 'smart' | 'customize';
}

class Timer extends PureComponent<ITimerProps & WithTranslation, ITimerState> {

    constructor(props: ITimerProps) {
        super(props);

        this.state = {
            isPause: false,
            remainingTime: this.props.globalDuration || 5000,
            playMode: 'balance'
        };
    }

    initEvent = () => {
    }

    render() {
        const t = this.props.t;

        return (
            <div className={`${style.timer} ${this.props.show ? '' : style.hidden}`} >
                <div className={style.buttonWrapper}>
                    <div className={style.button} style={{ display: this.state.isPause ? 'block' : 'none' }}>
                        <PlayCircleOutlined />
                    </div>
                    <div className={style.button} style={{ display: !this.state.isPause ? 'block' : 'none' }}>
                        <PauseCircleOutlined />
                    </div>
                    <div className={style.button} style={{ display: this.state.playMode === 'balance' ? 'block' : 'none' }}>
                        <ForwardOutlined />
                    </div>
                    <div className={style.button} style={{ display: this.state.playMode === 'customize' ? 'block' : 'none' }}>
                        <FormOutlined />
                    </div>
                    <div className={style.button} style={{ display: this.state.playMode === 'smart' ? 'block' : 'none' }}>
                        <LineChartOutlined />
                    </div>
                </div>
            </div>
        );
    }
}

const timer = withTranslation()(Timer);
export { timer as Timer };
