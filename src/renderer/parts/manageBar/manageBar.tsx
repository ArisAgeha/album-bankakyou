import * as React from 'react';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { extractDirUrlFromKey } from '@/common/utils';
import style from './manageBar.scss';
import { useTranslation, withTranslation } from 'react-i18next';
import bgimg from '@/renderer/static/image/background02.jpg';
import { Select } from '@/renderer/components/select/select';
import value from '@/renderer/static/image/background02.jpg';
const { Option } = Select;

type readingMode = 'scroll' | 'double_page' | 'single_page' | '_different';
type readingDirection = 'LR' | 'RL' | '_different';
type pageReAlign = boolean | '_different';

export interface IManageBarState {
    urls: string[];
    readingMode: readingMode;
    readingDirection: readingDirection;
    pageReAlign: pageReAlign;
    historyState: {
        readingMode: readingMode;
        readingDirection: readingDirection;
        pageReAlign: pageReAlign;
    };
}

export class ManageBar extends React.PureComponent<{}, IManageBarState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            urls: [],
            readingMode: 'double_page',
            readingDirection: 'LR',
            pageReAlign: false,
            historyState: {
                readingMode: 'double_page',
                readingDirection: 'LR',
                pageReAlign: false
            }
        };
    }

    componentDidMount() {
        this.initEvent();
    }

    initEvent() {
        EventHub.on(eventConstant.SHOW_MANAGE_BAR, (data: string[]) => {
            const urls = data.map(extractDirUrlFromKey);
            console.log(urls);
        });
    }

    renderCategory = () => {
        const { t, i18n } = useTranslation();
        return (
            <div className={style.group}>
                <h2>{t('%category%')}</h2>
                <div className={style.item}>
                    <h3>{t('%tag%')}</h3>
                    <div>TODO</div>
                </div>
                <div className={style.item}>
                    <h3>{t('%author%')}</h3>
                    <div>TODO</div>
                </div>
            </div>
        );
    }
    handleSelectPageReAlign = () => { };

    setReadingDirection = (value: any) => {
        this.setState({ readingDirection: value });
    }

    setReadingMode = (value: any) => {
        this.setState({ readingMode: value });
    }

    setPageReAlign = (value: any) => {
        this.setState({ pageReAlign: value });
    }

    renderReadingSettings = () => {
        const { t, i18n } = useTranslation();

        return (
            <div className={style.group}>
                <h2>{t('%readingSettings%')}</h2>
                <div className={style.item}>
                    <h3>{t('%readingMode%')}</h3>
                    <div>
                        <Select value={this.state.readingMode} onChange={this.setReadingMode}>
                            <Option value={'scroll'}>{t('%scrollMode%')}</Option>
                            <Option value={'single_page'}>{t('%singlePageMode%')}</Option>
                            <Option value={'double_page'}>{t('%doublePageMode%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%readingDirection%')}</h3>
                    <div>
                        <Select value={this.state.readingDirection} onChange={this.setReadingDirection}>
                            <Option value={'LR'}>{t('%fromLeftToRight%')}</Option>
                            <Option value={'RL'}>{t('%fromRightToLeft%')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={style.item}>
                    <h3>{t('%pageReAlign%')}</h3>
                    <div>
                        <Select value={this.state.pageReAlign} onChange={this.setPageReAlign}>
                            <Option value={true}>{t('%yes%')}</Option>
                            <Option value={false}>{t('%no%')}</Option>
                        </Select>
                    </div>
                </div>
            </div>
        );
    }

    render(): JSX.Element {
        const Category = this.renderCategory;
        const ReadingSettings = this.renderReadingSettings;

        return <div className={style.manageBar} style={{ backgroundImage: `url(${bgimg})` }}>
            <div className={`${style.scrollWrapper} medium-scrollbar`}>
                <Category />
                <ReadingSettings />
            </div>
        </div>;
    }
}
