import { useMemo } from 'react';
import { isDifficulty, type Difficulty } from '@zudoku/shared';
import { useHashRoute } from './hooks/useHashRoute';
import { ChallengePage } from './pages/ChallengePage';
import { HomePage } from './pages/HomePage';
import { SoloPage } from './pages/SoloPage';
import { TechniquesPage } from './pages/TechniquesPage';

export function App() {
  const [path, navigate] = useHashRoute();
  const route = useMemo(() => parseRoute(path), [path]);

  switch (route.name) {
    case 'solo':
      return <SoloPage difficulty={route.difficulty} navigate={navigate} />;
    case 'challenge':
      return <ChallengePage code={route.code} navigate={navigate} />;
    case 'techniques':
      return <TechniquesPage navigate={navigate} />;
    default:
      return <HomePage navigate={navigate} />;
  }
}

export type Route =
  | { name: 'home' }
  | { name: 'solo'; difficulty: Difficulty }
  | { name: 'challenge'; code: string | null }
  | { name: 'techniques' };

/** Routes are hash based so invite links survive a static host and a reload. */
export function parseRoute(path: string): Route {
  const [head, tail] = path.replace(/^\//, '').split('/');
  switch (head) {
    case 'solo':
      return { name: 'solo', difficulty: isDifficulty(tail) ? tail : 'easy' };
    case 'challenge':
      return { name: 'challenge', code: tail ? tail.toUpperCase() : null };
    case 'techniques':
      return { name: 'techniques' };
    default:
      return { name: 'home' };
  }
}
