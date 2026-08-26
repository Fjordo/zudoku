import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { TechniquesGuide } from '../features/techniques/TechniquesGuide';
import { useI18n } from '../i18n';
import './pages.css';

interface TechniquesPageProps {
  navigate: (path: string) => void;
}

/** The guide as a page of its own, reached from home. */
export function TechniquesPage({ navigate }: TechniquesPageProps) {
  const { t } = useI18n();

  return (
    <div className="page">
      {/* A reference section earns a real heading: squeezing a long title between
          two controls costs three cramped lines on a phone. */}
      <header className="topbar">
        <button type="button" className="button button--ghost" onClick={() => navigate('/')}>
          {t('common.back')}
        </button>
        <LanguageSwitcher />
      </header>

      <TechniquesGuide />
    </div>
  );
}
