import React, { useState, useEffect } from 'react';
import style from './tagSelector.scss';
import { Tag } from '../tag/tag';
import { isArray } from '@/common/types';
import bgimg from '@/renderer/static/image/background03.jpg';
import { useTranslation } from 'react-i18next';
import { CiCircleOutlined, CloseOutlined, UpCircleOutlined, CheckOutlined } from '@ant-design/icons';

export interface ITagSelectorProps {
    visible: boolean;
    selectedTags: string[];
    onSubmit?(selectedTags: string[]): void;
    onCancel?(): void;
}

export interface ITagSelectorState {
    tags: string[];
    selectedTags: string[];
    newTagName: string;
}

export class TagSelector extends React.PureComponent<ITagSelectorProps, ITagSelectorState> {
    constructor(props: ITagSelectorProps) {
        super(props);

        this.state = {
            tags: [],
            selectedTags: [],
            newTagName: ''
        };
    }

    componentDidMount() {
        this.initSelectedTags();
        this.fetchTags();
    }

    componentWillUnmount() {
    }

    componentDidUpdate(prevProps: ITagSelectorProps) {
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
        if (onCancel) onCancel();
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
        if (onSubmit) onSubmit(tags);
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

        return (<div className={style.tagSelector}>
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
    }
}