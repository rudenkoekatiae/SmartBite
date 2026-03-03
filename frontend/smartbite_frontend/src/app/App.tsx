import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { MealProvider } from './meal-context';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Shopping } from './components/Shopping';
import { Account } from './components/Account';
import { Toaster } from 'sonner';

const Root = () => {
  return (
    <MealProvider>
      <Toaster position="top-center" expand={false} richColors />
      <Layout />
    </MealProvider>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'shopping',
        Component: Shopping,
      },
      {
        path: 'account',
        Component: Account,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
