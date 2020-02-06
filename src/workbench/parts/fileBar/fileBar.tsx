import React, { Component, SetStateAction } from 'react';
import style from './fileBar.scss';

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
    return <div className={style.test}></div>;
  }
}
