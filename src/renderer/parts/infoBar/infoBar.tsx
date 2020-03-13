import React, { Component, SetStateAction, PureComponent } from 'react';

export interface IInfoBarProps {}

export interface IInfoBarState {}

export class InfoBar extends PureComponent<IInfoBarProps, IInfoBarState> {
    state: IInfoBarState = {};

    render(): JSX.Element {
        return <div></div>;
    }
}
