'use client';
import * as React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { useTranslations } from 'next-intl';

export function AppTour() {
  const t = useTranslations('AppTour');
  const [run, setRun] = React.useState(false);
  
  const tourSteps: Step[] = [
    {
      target: 'body',
      content: t('step1_content'),
      placement: 'center',
      title: t('step1_title'),
    },
    {
      target: '#create-profile-button',
      content: t('step2_content'),
      title: t('step2_title'),
    },
    {
      target: '#browse-profiles-button',
      content: t('step3_content'),
      title: t('step3_title'),
    },
    {
      target: '#nearby-profiles-section',
      content: t('step4_content'),
      title: t('step4_title'),
    },
    {
      target: '#language-switcher',
      content: t('step5_content'),
      title: t('step5_title'),
    }
  ];


  React.useEffect(() => {
    const hasOnboarded = localStorage.getItem('madhubani_nikah_onboarded_tour');
    if (!hasOnboarded) {
      // Use a timeout to ensure the DOM is ready
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
        localStorage.setItem('madhubani_nikah_onboarded_tour', 'true');
        setRun(false);
    }
  };

  return (
    <Joyride
      run={run}
      steps={tourSteps}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          zIndex: 1000,
        },
        spotlight: {
          borderRadius: 'var(--radius)',
        },
        tooltip: {
          borderRadius: 'var(--radius)',
          padding: '1rem'
        },
        tooltipTitle: {
          fontFamily: 'var(--font-headline)',
          fontSize: '1.5rem',
          fontWeight: 700,
        },
        tooltipContent: {
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          paddingTop: '1rem',
        },
        buttonNext: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem'
        },
        buttonBack: {
            color: 'hsl(var(--foreground))',
            padding: '0.75rem 1.5rem',
        },
        buttonSkip: {
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.875rem'
        },
        buttonClose: {
            display: 'none',
        },
      }}
    />
  );
}
