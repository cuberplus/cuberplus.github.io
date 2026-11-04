import { FunctionComponent, ReactElement } from 'react';

declare function Navigation(props: {
  current: 'home' | 'timer' | 'smartcubeanalyzer' | 'scrambler';
}): ReactElement;
declare namespace Navigation {
  const Footer: FunctionComponent;
  const APP_VERSION: string;
}
export = Navigation;
