import * as React from 'react';
import { MenuBar } from './menuBar/menuBar';
import { FileBar } from './fileBar/fileBar';
import { MainView } from './mainView/mainView';
import { ManageBar } from './manageBar/manageBar';
import './Layout.scss';

class Layout extends React.Component {
  render(): JSX.Element {
    return (
      <div className='layout'>
        <div className='top'>
          <div className='menuBar'>
            <MenuBar></MenuBar>
          </div>
        </div>

        <div className='bottom'>
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
      </div>
    );
  }
}

export { Layout };
