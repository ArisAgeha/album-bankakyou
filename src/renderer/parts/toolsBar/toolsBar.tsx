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
    TeamOutlined
} from '@ant-design/icons';
import 'reflect-metadata';
import { remote } from 'electron';
import { FileService } from '@/main/services/file.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { db } from '@/common/nedb';
import { serviceConstant } from '@/common/constant/service.constant';
import { isDev } from '@/common/utils/functionTools';

export interface IToolsBarProps {
    toolsBarWidth: number;
    changeFilebarView: Function;
}

export interface IToolsBarState {
    activeIndex: number;
}

export class ToolsBar extends PureComponent<IToolsBarProps, IToolsBarState> {
    constructor(props: IToolsBarProps) {
        super(props);

        this.state = {
            activeIndex: 0
        };
    }

    handleOpenMultipleDir(dirs: string[]) {
        if (!dirs) return;
        const serviceCollection: ServiceCollection = remote.getGlobal(serviceConstant.SERVICE_COLLECTION);
        const fileService: FileService = serviceCollection.get(serviceConstant.FILE);

        dirs.forEach(async dir => {
            const dirsInStore = await db.directory.find({ url: dir }).exec();
            if (dirsInStore.length === 0) fileService.openDirByImport(dir);
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

        const icons = [
            {
                jsx: <ProfileOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'directory'
            },
            {
                jsx: <BarsOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'collection'
            },
            {
                jsx: <TagsOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'tag'
            },
            {
                jsx: <TeamOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                view: 'author'
            }
        ];

        return (
            <div className={style.top}>
                {icons.map((buttonObj, index) => (
                    <ButtonBox
                        icon={buttonObj.jsx}
                        index={index}
                        key={index}
                        shouldActive={true}
                        onClick={() => {
                            this.props.changeFilebarView(buttonObj.view);
                            this.setState({
                                activeIndex: index
                            });
                        }}
                    ></ButtonBox>
                ))}
            </div>
        );
    }

    bottomButton = (props: any): JSX.Element => {
        const ButtonBox = this.buttonBox;

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

            // swap view mode.
            // {
            //     jsx: <SwapOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
            //     onClick: () => {
            //         EventHub.emit(eventConstant.SWITCH_PICTURE_MODE);
            //     }
            // },

            // import directory button
            {
                jsx: <ImportOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                onClick: () => {
                    const dialog = remote.dialog;
                    const dirs = dialog.showOpenDialogSync({ properties: ['openDirectory', 'multiSelections', 'showHiddenFiles'] });
                    this.handleOpenMultipleDir(dirs);
                }
            },
            // setting button
            {
                jsx: <SettingOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                onClick: () => {}
            }
        ];

        const buttonsJSX = buttons
            .filter(buttonObj => isDev || !buttonObj.isDev)
            .map((buttonObj, index) => (
                <ButtonBox icon={buttonObj.jsx} index={index} key={index} shouldActive={false} onClick={buttonObj.onClick}></ButtonBox>
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
