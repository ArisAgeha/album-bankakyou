import * as React from 'react';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { extractDirUrlFromKey } from '@/common/utils';
import style from './manageBar.scss';
import { useTranslation } from 'react-i18next';
import bgimg from '@/renderer/static/image/background02.jpg';

export class ManageBar extends React.PureComponent {
    constructor(props: null) {
        super(props);

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

    renderReadingSettings = () => {
        const { t, i18n } = useTranslation();
        return (
            <div className={style.group}>
                <h2>{t('%readingSettings%')}</h2>
                <div className={style.item}>
                    <h3>{t('%readingMode%')}</h3>
                    <div>TODO</div>
                </div>
                <div className={style.item}>
                    <h3>{t('%readingDirection%')}</h3>
                    <div>TODO</div>
                </div>
                <div className={style.item}>
                    <h3>{t('%pageReAlign%')}</h3>
                    <div>TODO</div>
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
