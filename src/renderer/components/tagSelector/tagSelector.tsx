import React, { useState, useEffect, createElement } from 'react';
import style from './tagSelector.scss';
import { Tag } from '../tag/tag';
import { isArray } from '@/common/utils/types';
import bgimg from '@/renderer/static/image/background03.jpg';
import { useTranslation } from 'react-i18next';
import { CiCircleOutlined, CloseOutlined, UpCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { EventHub } from '@/common/eventHub';
import { eventConstant } from '@/common/constant/event.constant';
import { createPortal } from 'react-dom';
import { db } from '@/common/nedb';
import { IDirectoryData } from '@/renderer/parts/fileBar/directoryView/directoryView';

export interface ITagSelectorProps {
    visible: boolean;
    selectedTags: IDirectoryData['tag'] | '_different';
    onSubmit?(selectedTags: string[]): void;
    onCancel?(): void;
}

export interface ITagSelectorState {
    tags: string[];
    selectedTags: string[];
    newTagName: string;
}

const modalRoot = document.getElementById('modal-root');

export class TagSelector extends React.PureComponent<ITagSelectorProps, ITagSelectorState> {
    el: HTMLDivElement;

    constructor(props: ITagSelectorProps) {
        super(props);

        this.el = document.createElement('div');

        this.state = {
            tags: [],
            selectedTags: [],
            newTagName: ''
        };
    }

    componentDidMount() {
        modalRoot.appendChild(this.el);
        this.initSelectedTags();
        this.fetchTags();
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el);
    }

    componentDidUpdate(prevProps: ITagSelectorProps) {
        if (this.props.visible) EventHub.emit(eventConstant.SET_BLUR_BODY);
        if (prevProps.selectedTags !== this.props.selectedTags) this.fetchTags();
    }

    initSelectedTags() {
        const selectedTags = isArray(this.props.selectedTags) ? [...this.props.selectedTags] : [];
        this.setState({ selectedTags });
    }

    fetchTags() {
        this.setState({
            tags: ['a', 'bbb', 'ccccc', 'ddd', Math.random().toFixed(3), 'ccc']
        });
    }

    toggleTag(tag: string) {
        if (!tag) return;
        if (this.state.selectedTags.includes(tag)) this.closeTag(tag);
        else this.addTag(tag);
    }

    addTag(tag: string) {
        const selectedTags = [...this.state.selectedTags, tag];
        this.setState({ selectedTags });
    }

    closeTag(tag: string) {
        const selectedTags = [...this.state.selectedTags];
        const index = selectedTags.indexOf(tag);
        selectedTags.splice(index, 1);
        this.setState({ selectedTags });
    }

    hiddenPanel = () => {
        const onCancel = this.props.onCancel;
        if (onCancel) {
            onCancel();
            EventHub.emit(eventConstant.UNSET_BLUR_BODY);
        }
    }

    checkHasChange = () => {
        const selectedTags = this.state.selectedTags;
        const originTags = this.props.selectedTags;
        if (isArray(originTags)
            && !(originTags.length === selectedTags.length && (Array.from(new Set([...originTags, ...selectedTags])).length === originTags.length))) return true;
        else if ((!isArray(originTags) || originTags.length === 0) && selectedTags.length !== 0) return true;
        return false;
    }

    handleSubmit = () => {
        const hasChange = this.checkHasChange();
        if (!hasChange) return;

        const { onSubmit } = this.props;
        const tags = this.state.selectedTags;
        if (onSubmit) {
            onSubmit(tags);
            EventHub.emit(eventConstant.UNSET_BLUR_BODY);
        }
    }

    handleInputSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { this.toggleTag(this.state.newTagName); }
    }

    renderInput = () => {
        const { t, i18n } = useTranslation();
        return <input
            type='text'
            className={style.addTagInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { this.setState({ newTagName: e.target.value }); }}
            value={this.state.newTagName}
            placeholder={t('%addTagHere%')}
            onKeyDown={this.handleInputSubmit} />;
    }

    render() {
        const Input = this.renderInput;
        const selectedTags = this.state.selectedTags;
        const originTags = this.props.selectedTags;
        const tags = this.state.tags;
        const hasChange = this.checkHasChange();

        const children = (<div className={style.tagSelector} style={{ display: this.props.visible ? 'flex' : 'none' }}>
            <div className={style.mask} onClick={this.hiddenPanel}></div>
            <div className={`${style.panelWrapper} useBlurBg`} style={{ backgroundImage: `url(${bgimg})` }}>

                <div className={style.controlPanel}>
                    <div className={`${style.scrollWrapper} medium-scrollbar`}>
                        <Input />
                        {
                            selectedTags.map(tag =>
                                <Tag key={tag} onClose={() => { this.closeTag(tag); }} closeByWheelClick>{tag}</Tag>)
                        }
                    </div>
                </div>

                <div className={style.selectPanel}>
                    <div className={`${style.scrollWrapper} medium-scrollbar`}>
                        {
                            tags.map(tag => {
                                if (!tag.includes(this.state.newTagName)) return '';
                                return <Tag key={tag} onClick={() => { this.toggleTag(tag); }} isActive={selectedTags.includes(tag)}>{tag}</Tag>;
                            })
                        }
                    </div>
                </div>
                <div className={style.submitPanel}>
                    <span className={`${style.submitButton} ${hasChange ? style.active : ''}`} onClick={this.handleSubmit}>
                        <CheckOutlined></CheckOutlined>
                    </span>
                    <span className={style.cancelButton} onClick={this.hiddenPanel}>
                        <CloseOutlined></CloseOutlined>
                    </span>
                </div>
            </div>
        </div>);

        return createPortal(children, this.el);
    }
}