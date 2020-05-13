import React, { Component, SetStateAction, MouseEventHandler, PureComponent } from 'react';
import style from './toolsBar.scss';
import {
    SettingOutlined,
    ProfileOutlined,
    BarsOutlined,
    ImportOutlined,
    TagsOutlined,
    ToolOutlined,
    DeleteOutlined,
    SwapOutlined,
    TeamOutlined,
    SyncOutlined
} from '@ant-design/icons';
import 'reflect-metadata';
import { remote, app, ipcRenderer } from 'electron';
import { FileService } from '@/main/services/file.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { db } from '@/common/nedb';
import { serviceConstant } from '@/common/constant/service.constant';
import { isDev } from '@/common/utils/functionTools';
import { openNotification, hintText, hintMainText } from '@/renderer/utils/tools';
import { WithTranslation, withTranslation } from 'react-i18next';
import axios from 'axios';
import { isArray } from '@/common/utils/types';
import { checkHasNewVersion, extractVersionFromString, extractDirNameFromUrl } from '@/common/utils/businessTools';
import { Button, notification, Progress } from 'antd';
import { eventConstant } from '@/common/constant/event.constant';
import { command } from '@/common/constant/command.constant';
import { throttle } from '@/common/decorator/decorator';
const { shell } = require('electron');

export interface IToolsBarProps extends WithTranslation {
    toolsBarWidth: number;
    changeFilebarView: Function;
}

export interface IToolsBarState {
    activeIndex: number;
    updating: boolean;
}

class ToolsBar extends PureComponent<IToolsBarProps & WithTranslation, IToolsBarState> {
    constructor(props: IToolsBarProps) {
        super(props);

        this.state = {
            activeIndex: 0,
            updating: false
        };
    }

    componentDidMount() {
        const t = this.props.t;

        ipcRenderer.on(command.DOWNLOAD_PROGRESS, (event: any, progress: number) => {
            hintText([
                { text: `${t('%downloadProgress%')}` },
                { text: `${String(progress)} %`, color: 'rgb(255, 0, 200)' }
            ]);
        });

        ipcRenderer.on(command.DOWNLOAD_FAIL, (event: any) => {
            openNotification(t('%downloadHint%'), t('%downloadFail%'));
            this.setState({
                updating: false
            });
        });

        ipcRenderer.on(command.DOWNLOAD_SUCCESS, (event: any) => {
            openNotification(t('%downloadHint%'), t('%downloadSuccess%'));
            this.setState({
                updating: false
            });
        });
    }

    handleOpenMultipleDir(dirs: string[]) {
        if (!dirs) return;
        const serviceCollection: ServiceCollection = remote.getGlobal(serviceConstant.SERVICE_COLLECTION);
        const fileService: FileService = serviceCollection.get(serviceConstant.FILE);
        const t = this.props.t;

        dirs.forEach(async dir => {
            const dirsInStore = await db.directory.find({ url: dir, auto: true }).exec();
            if (dirsInStore.length === 0) {
                openNotification(t('%importingDir%'), dir, { duration: 2, closeOtherNotification: false });
                fileService.openDirByImport(dir);
            }
        });
    }

    buttonBox = (props: { index: number; icon: JSX.Element; shouldActive: boolean; onClick: any }): JSX.Element => (
        <div
            className={`${style.item} ${props.shouldActive && this.state.activeIndex === props.index ? style.isActive : ''}`}
            style={{ width: this.props.toolsBarWidth, height: this.props.toolsBarWidth }}
            onClick={props.onClick}
        >
            {props.icon}
        </div>
    )

    topButton = (): JSX.Element => {
        const ButtonBox = this.buttonBox;
        const t = this.props.t;

        const icons = [
            {
                jsx: <ProfileOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'directory',
                hintMainText: t('%directoryTreeDesc%')
            },
            {
                jsx: <TagsOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'tag',
                hintMainText: t('%tagDesc%')
            },
            {
                jsx: <TeamOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'author',
                hintMainText: t('%authorDesc%')
            }
        ];

        return (
            <div className={style.top}>
                {icons.map((buttonObj, index) => (
                    <div key={index} onMouseEnter={() => { hintMainText(buttonObj.hintMainText); }}>
                        <ButtonBox
                            icon={buttonObj.jsx}
                            index={index}

                            shouldActive={true}
                            onClick={() => {
                                this.props.changeFilebarView(buttonObj.view);
                                this.setState({
                                    activeIndex: index
                                });
                            }}
                        ></ButtonBox>
                    </div>
                ))}
            </div>
        );
    }

    update = async (url: string) => {
        const t = this.props.t;
        notification.destroy();

        this.setState({
            updating: true
        });

        // notify the download status and provide a external download link
        openNotification(
            t('%downloadingLatestVersion%'),
            t('%manuallyDownloadHint%'),
            {
                duration: 1500,
                closeOtherNotification: true,
                btn: (
                    <Button type='primary' size='small' onClick={() => { shell.openExternal('https://github.com/ArisAgeha/album-bankakyou/releases'); }} className={style.updateButton}>
                        {t('%openLink%')}
                    </Button>
                )
            }
        );

        openNotification(
            t('%downloadingLatestVersion%'),
            t('%installPostitionDesc%'),
            {
                duration: 1500,
                closeOtherNotification: false,
                btn: (
                    <Button type='primary' size='small' onClick={() => { shell.openExternal('https://github.com/ArisAgeha/album-bankakyou/releases'); }} className={style.updateButton}>
                        {t('%openLink%')}
                    </Button>
                )
            }
        );

        // download the file, meanwhile, get the download progress
        ipcRenderer.send(command.DOWNLOAD_UPDATE, url);
    }

    checkUpdate = async () => {
        const t = this.props.t;

        if (this.state.updating) return;

        openNotification(t('%checkingNewVersion%'), t('%pleaseWait%'), { duration: 4.5, closeOtherNotification: false });
        try {
            const releaseListData = await axios.get('https://api.github.com/repos/ArisAgeha/album-bankakyou/releases?per_page=100');
            const releaseList = releaseListData?.data;
            const exeFileUrl = isArray(releaseList) && releaseList[0]?.assets?.find((item: any) => item.name.endsWith('.exe')).browser_download_url;

            // if there is no `.exe` file found in remote, return
            if (!exeFileUrl) {
                openNotification(t('%updateTips%'), t('%isLatestVersion%'), { duration: 3, closeOtherNotification: true });
                return;
            }

            const remoteVersion = extractVersionFromString(releaseList[0].tag_name);
            const localVersion = remote.app.getVersion();
            const hasNewVersion = checkHasNewVersion(remoteVersion, localVersion);

            // if there is latest version in remote, ask if user needs to update
            if (hasNewVersion) {
                openNotification(
                    `${t('%newVersion%')} v${remoteVersion}, ${t('%currentVersion%')}v${localVersion}`,
                    t('%hasNewVersion%'),
                    {
                        duration: 1500,
                        closeOtherNotification: true,
                        btn: (
                            <Button type='primary' size='small' onClick={() => { this.update(exeFileUrl); }} className={style.updateButton}>
                                {t('%ok%')}
                            </Button>
                        )
                    });
            }
            else {
                openNotification(
                    `${t('%newVersion%')} v${remoteVersion}, ${t('%currentVersion%')}v${localVersion}`,
                    t('%isLatestVersion%'),
                    { duration: 3, closeOtherNotification: true });
            }
        }
        // Network error
        catch (err) {
            openNotification(t('%updateTips%'), t('%checkFail%'), { duration: 3, closeOtherNotification: true });
        }
    }

    bottomButton = (props: any): JSX.Element => {
        const ButtonBox = this.buttonBox;
        const t = this.props.t;

        const buttons = [
            // dev
            {
                isDev: true,
                jsx: <DeleteOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                onClick: async () => {
                    db.directory.remove({}, { multi: true });
                }
            },
            {
                isDev: true,
                jsx: <ToolOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                onClick: async () => {
                    console.log(await db.directory.find({}).exec());
                    console.log(await db.collection.find({}).exec());
                    console.log(await db.tag.find({}).exec());
                }
            },
            // import directory button
            {
                jsx: <SyncOutlined
                    style={{ fontSize: this.props.toolsBarWidth * 0.5 }}
                    spin={this.state.updating ? true : false}
                />,
                onClick: this.checkUpdate,
                hintMainText: t('%updateDesc%')
            },
            {
                jsx: <ImportOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                onClick: () => {
                    const dialog = remote.dialog;
                    const dirs = dialog.showOpenDialogSync({ properties: ['openDirectory', 'multiSelections', 'showHiddenFiles'] });
                    this.handleOpenMultipleDir(dirs);
                },
                hintMainText: t('%importDesc%')
            }
            // setting button
            // {
            //     jsx: <SettingOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
            //     onClick: () => { }
            // }
        ];

        const buttonsJSX = buttons
            .filter(buttonObj => (isDev() && buttonObj.isDev) || !buttonObj.isDev)
            .map((buttonObj, index) => (
                <div key={index} onMouseEnter={() => { hintMainText(buttonObj.hintMainText); }}>
                    <ButtonBox
                        icon={buttonObj.jsx}
                        index={index}
                        shouldActive={false}
                        onClick={buttonObj.onClick}></ButtonBox>
                </div>
            ));

        return <div className={style.top}>{buttonsJSX}</div>;
    }

    render(): JSX.Element {
        const TopButton = this.topButton;
        const BottomButton = this.bottomButton;
        return (
            <div className={style.toolsBarWrapper}>
                <TopButton></TopButton>
                <BottomButton></BottomButton>
            </div>
        );
    }
}

const toolsBar = withTranslation()(ToolsBar);
export { toolsBar as ToolsBar };