import * as React from 'react';
import { FileBar } from './parts/fileBar/fileBar';
import { MainView } from './parts/mainView/mainView';
import { ManageBar } from './parts/manageBar/manageBar';
import './Layout.scss';

class Layout extends React.Component {
  render(): JSX.Element {
    return (
      <div className='layout'>
        <div className='left'>
          <div className='fileBar'>
            <FileBar></FileBar>
          </div>
        </div>

        <div className='right'>
          <div className='mainView'>
            <MainView></MainView>
          </div>

          <div className='manageBar'>
            <ManageBar></ManageBar>
          </div>
        </div>
      </div>
    );
  }
}

export { Layout };
