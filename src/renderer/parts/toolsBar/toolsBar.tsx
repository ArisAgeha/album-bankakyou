import React, { Component, SetStateAction } from 'react';

export interface IToolsBarProps {}

export interface IToolsBarState {}

export class ToolsBar extends Component<IToolsBarProps, IToolsBarState> {
    state: IToolsBarState = {};

    render(): JSX.Element {
        return <div></div>;
    }
}
