import React, { useState, useEffect } from 'react';
import style from './tag.scss';
import { CloseOutlined } from '@ant-design/icons';

export interface ITag {
    children: string;
    onClick?(): void;
    onClose?(label?: string): void;
    closable?: boolean;
    isActive?: boolean;
}

export function Tag(props: ITag) {
    const { children, onClick, onClose, isActive } = props;
    console.log(isActive);

    return (<span className={`${style.tag} ${isActive ? style.active : ''}`} onClick={(e) => { if (onClick) onClick(); }}>
        <span>{children}</span>
        {onClose ? <CloseOutlined className={style.closeButton} onClick={() => { if (onClose) onClose(); }} /> : ''}

    </span>);
}