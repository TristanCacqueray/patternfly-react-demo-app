import Status from './pages/Status';
import Jobs from './pages/Jobs';
import Builds from './pages/Builds';
const baseName = '/';

const routes = () => [
  {
    iconClass: 'fa pficon-in-progress',
    title: 'Status',
    to: '/status',
    component: Status
  },
  {
    iconClass: 'fa fa-list',
    title: 'Jobs',
    to: '/jobs',
    component: Jobs
  },
  {
    iconClass: 'fa fa-table',
    title: 'Builds',
    to: '/builds',
    component: Builds
  }
];

export { baseName, routes };
