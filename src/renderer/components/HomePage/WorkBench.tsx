import React, { Component, SetStateAction } from 'react';
import { defaultPath } from 'src/renderer/constant/file';

export interface WorkBenchProps {
  initPath: string;
}

export interface WorkBenchState {
  directory: {
    [key: string]: string;
  };
}

export class WorkBench extends Component<WorkBenchProps, WorkBenchState> {
  static defaultProps = {
    initPath: 'C:/' as WorkBenchProps['initPath']
  };

  state: WorkBenchState = {
    directory: {}
  };

  render(): JSX.Element {
    return <div></div>;
  }
}
