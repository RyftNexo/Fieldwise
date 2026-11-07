import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { featureRoutes } from './features';
import { Layout } from './Layout';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      ...featureRoutes,
      {
        path: '*',
        element: (
          <p className="mx-auto max-w-6xl px-4 py-16 text-soil-600 sm:px-6">Page not found.</p>
        ),
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
