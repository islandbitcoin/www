/**
 * Wrapper component for lazy-loaded components
 * Provides loading states and error boundaries for code-split components
 */

import { Suspense, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Default loading skeleton for game components
const GameLoadingSkeleton = () => (
  <Card>
    <CardContent className="py-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Default loading skeleton for admin components
const AdminLoadingSkeleton = () => (
  <div className="max-w-2xl mx-auto p-6">
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Default loading skeleton for form components
const FormLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
    <div className="flex justify-end">
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);


// Pre-defined loading skeletons for different component types
export const loadingSkeletons = {
  game: <GameLoadingSkeleton />,
  admin: <AdminLoadingSkeleton />,
  form: <FormLoadingSkeleton />,
  default: (
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
};

export function LazyWrapper({ 
  children, 
  fallback = loadingSkeletons.default
}: LazyWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Lazy component loading error:', error, errorInfo);
      }}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Utility function to create lazy-wrapped components
// export function withLazyWrapper<T extends ComponentType<never>>(
//   Component: T,
//   skeletonType: keyof typeof loadingSkeletons = 'default'
// ) {
//   return function WrappedComponent(props: React.ComponentProps<T>) {
//     return (
//       <LazyWrapper fallback={loadingSkeletons[skeletonType]}>
//         <Component {...props} />
//       </LazyWrapper>
//     );
//   };
// }