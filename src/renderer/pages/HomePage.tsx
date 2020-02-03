import * as React from 'react';
import { MenuBar } from '../components/HomePage/MenuBar';
import { WorkBench } from '../components/HomePage/WorkBench';
import { MainViewer } from '../components/HomePage/MainViewer';
import { ShowList } from '../components/HomePage/ShowList';

class HomePage extends React.Component {
  render(): JSX.Element {
    return (
      <div>
        <div className='top'>
          <MenuBar></MenuBar>
        </div>
        <div className='bottom'>
          <WorkBench></WorkBench>
          <MainViewer></MainViewer>
        </div>
        <div className='portal'>
          <ShowList></ShowList>
        </div>
      </div>
    );
  }
}

export { HomePage };
