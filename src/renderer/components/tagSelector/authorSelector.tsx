import React, { useState, useEffect, createElement } from 'react';
import style from './selector.scss';
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

export interface IAuthorSelectorProps {
    visible: boolean;
    selectedAuthors: IDirectoryData['author'] | '_different';
    onSubmit?(selectedAuthors: string[]): void;
    onCancel?(): void;
}

export interface IAuthorSelectorState {
    authors: string[];
    selectedAuthors: string[];
    newAuthorName: string;
}

const modalRoot = document.getElementById('modal-root');

export class AuthorSelector extends React.PureComponent<IAuthorSelectorProps, IAuthorSelectorState> {
    el: HTMLDivElement;

    constructor(props: IAuthorSelectorProps) {
        super(props);

        this.el = document.createElement('div');

        this.state = {
            authors: [],
            selectedAuthors: [],
            newAuthorName: ''
        };
    }

    componentDidMount() {
        modalRoot.appendChild(this.el);
        this.initSelectedAuthors();
        this.fetchAuthors();
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el);
    }

    componentDidUpdate(prevProps: IAuthorSelectorProps) {
        if (this.props.visible) EventHub.emit(eventConstant.SET_BLUR_BODY);
        if (prevProps.selectedAuthors !== this.props.selectedAuthors) this.fetchAuthors();
    }

    initSelectedAuthors() {
        const selectedAuthors = isArray(this.props.selectedAuthors) ? [...this.props.selectedAuthors] : [];
        this.setState({ selectedAuthors });
    }

    async fetchAuthors() {
        const authors: string[] = (await db.author.find({}).exec()).map((author: any) => author.author_name);
        this.setState({
            authors
        });
    }

    toggleAuthor(author: string) {
        if (!author) return;
        if (this.state.selectedAuthors.includes(author)) this.closeAuthor(author);
        else this.addAuthor(author);
    }

    addAuthor(author: string) {
        const selectedAuthors = [...this.state.selectedAuthors, author];
        this.setState({ selectedAuthors });
    }

    closeAuthor(author: string) {
        const selectedAuthors = [...this.state.selectedAuthors];
        const index = selectedAuthors.indexOf(author);
        selectedAuthors.splice(index, 1);
        this.setState({ selectedAuthors });
    }

    hiddenPanel = () => {
        const onCancel = this.props.onCancel;
        if (onCancel) {
            onCancel();
            EventHub.emit(eventConstant.UNSET_BLUR_BODY);
        }
    }

    checkHasChange = () => {
        const selectedAuthors = this.state.selectedAuthors;
        const originAuthors = this.props.selectedAuthors;
        if (isArray(originAuthors)
            && !(originAuthors.length === selectedAuthors.length && (Array.from(new Set([...originAuthors, ...selectedAuthors])).length === originAuthors.length))) return true;
        else if ((!isArray(originAuthors) || originAuthors.length === 0) && selectedAuthors.length !== 0) return true;
        return false;
    }

    handleSubmit = () => {
        const hasChange = this.checkHasChange();
        if (!hasChange) return;

        const { onSubmit } = this.props;
        const authors = this.state.selectedAuthors;
        if (onSubmit) {
            onSubmit(authors);
            EventHub.emit(eventConstant.UNSET_BLUR_BODY);
        }
    }

    handleInputSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { this.toggleAuthor(this.state.newAuthorName); }
    }

    renderInput = () => {
        const { t, i18n } = useTranslation();
        return <input
            type='text'
            className={style.addItemInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { this.setState({ newAuthorName: e.target.value }); }}
            value={this.state.newAuthorName}
            placeholder={t('%addAuthorHere%')}
            onKeyDown={this.handleInputSubmit} />;
    }

    render() {
        const Input = this.renderInput;
        const selectedAuthors = this.state.selectedAuthors;
        const originAuthors = this.props.selectedAuthors;
        const authors = this.state.authors;
        const hasChange = this.checkHasChange();

        const children = (<div className={style.itemSelector} style={{ display: this.props.visible ? 'flex' : 'none' }}>
            <div className={style.mask} onClick={this.hiddenPanel}></div>
            <div className={`${style.panelWrapper} useBlurBg`} style={{ backgroundImage: `url(${bgimg})` }}>

                <div className={style.controlPanel}>
                    <div className={`${style.scrollWrapper} medium-scrollbar`}>
                        <Input />
                        {
                            selectedAuthors.map(author =>
                                <Tag key={author} onClose={() => { this.closeAuthor(author); }} closeByWheelClick>{author}</Tag>)
                        }
                    </div>
                </div>

                <div className={style.selectPanel}>
                    <div className={`${style.scrollWrapper} medium-scrollbar`}>
                        {
                            authors.map(author => {
                                if (!author.includes(this.state.newAuthorName)) return '';
                                return <Tag key={author} onClick={() => { this.toggleAuthor(author); }} isActive={selectedAuthors.includes(author)}>{author}</Tag>;
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