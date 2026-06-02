import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { AppRoutes } from './App';

export function render(url: string, context: { helmetContext: any }) {
  return renderToString(
    <React.StrictMode>
      <HelmetProvider context={context.helmetContext}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
}
