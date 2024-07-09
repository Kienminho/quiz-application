import { Menu, MenuProps } from 'antd';
import { BookIcon, DoorOpen, Paperclip, Puzzle } from 'lucide-react';
import { Link } from 'react-router-dom';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  url?: string
): MenuItem {
  return {
    key,
    icon,
    children,
    label: url ? <Link to={url}>{label}</Link> : label
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Cổng trực tuyến', 'sub1', <DoorOpen />, [
    getItem('Cuộc thi', '1', <Puzzle />, undefined, '/dashboard/contest')
  ]),
  getItem('Kho nội dung', 'sub2', <BookIcon />, [getItem('Đề thi', '3', <Paperclip />, undefined, '/dashboard/quiz')])
];

export const AntMenu = () => {
  return <Menu defaultOpenKeys={['sub1']} defaultSelectedKeys={['1']} mode='inline' items={items} />;
};
