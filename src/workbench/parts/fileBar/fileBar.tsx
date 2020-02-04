import React, { Component, SetStateAction } from 'react';

export interface IFileBarProps {
  initPath?: string;
}

export interface IFileBarState {
  directory: {
    [key: string]: string;
  };
  expendedNodes: string[];
}

export class FileBar extends Component<IFileBarProps, IFileBarState> {
  state: IFileBarState = {
    directory: {},
    expendedNodes: []
  };

  render(): JSX.Element {
    return <div></div>;
  }
}
