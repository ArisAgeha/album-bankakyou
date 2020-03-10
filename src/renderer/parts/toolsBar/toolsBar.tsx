import React, { Component, SetStateAction, MouseEventHandler } from 'react';
import style from './toolsBar.scss';
import { SettingOutlined, ProfileOutlined, BarsOutlined, ImportOutlined, TagsOutlined, ToolOutlined } from '@ant-design/icons';
import 'reflect-metadata';
import { remote } from 'electron';
import { FileService } from '@/main/services/file.service';
import { ServiceCollection } from '@/common/serviceCollection';
import { ChokidarService } from '@/main/services/chokidar.service';
import { db } from '@/common/nedb';

export interface IToolsBarProps {
    toolsBarWidth: number;
    changeFilebarView: Function;
}

export interface IToolsBarState {
    activeIndex: number;
}

export class ToolsBar extends Component<IToolsBarProps, IToolsBarState> {
    constructor(props: IToolsBarProps) {
        super(props);

        this.state = {
            activeIndex: 0
        };
    }

    handleOpenMultipleDir(dirs: string[]) {
        if (!dirs) return;
        const serviceCollection: ServiceCollection = (remote.app as any).serviceCollection;
        const fileService: FileService = serviceCollection.get('fileService');

        dirs.forEach(async dir => {
            const dirsInStore = await db.directory.find({ url: dir }).exec();
            if (dirsInStore.length === 0) fileService.openDirByImport(dir, false);
        });
    }

    buttonBox(props: { index: number; icon: JSX.Element; shouldActive: boolean; onClick: any }): JSX.Element {
        return (
            <div
                className={`${style.item} ${props.shouldActive && this.state.activeIndex === props.index ? style.isActive : ''}`}
                style={{ width: this.props.toolsBarWidth, height: this.props.toolsBarWidth }}
                onClick={props.onClick}
            >
                {props.icon}
            </div>
        );
    }

    topButton(): JSX.Element {
        const ButtonBox = this.buttonBox.bind(this);

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

    bottomButton(props: any): JSX.Element {
        const ButtonBox = this.buttonBox.bind(this);

        const buttons = [
            // dev
            {
                jsx: <ToolOutlined style={{ fontSize: this.props.toolsBarWidth * 0.5 }} />,
                onClick: async () => {
                    console.log(await db.directory.find({}).exec());
                    console.log(await db.collection.find({}).exec());
                    console.log(await db.tag.find({}).exec());
                    db.directory.remove({}, { multi: true });
                }
            },
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

        return (
            <div className={style.top}>
                {buttons.map((buttonObj, index) => (
                    <ButtonBox icon={buttonObj.jsx} index={index} key={index} shouldActive={false} onClick={buttonObj.onClick}></ButtonBox>
                ))}
            </div>
        );
    }

    render(): JSX.Element {
        const TopButton = this.topButton.bind(this);
        const BottomButton = this.bottomButton.bind(this);
        return (
            <div className={style.toolsBarWrapper}>
                <TopButton></TopButton>
                <BottomButton></BottomButton>
            </div>
        );
    }
}
