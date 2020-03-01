import React, { Component, SetStateAction } from 'react';

export interface IInfoBarProps {}

export interface IInfoBarState {}

export class InfoBar extends Component<IInfoBarProps, IInfoBarState> {
    state: IInfoBarState = {};

    render(): JSX.Element {
        return <div></div>;
    }
}
