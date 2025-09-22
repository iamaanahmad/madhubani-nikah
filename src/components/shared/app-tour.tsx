'use client';
import * as React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';

const tourSteps: Step[] = [
    {
        target: 'body',
        content: 'Welcome to Madhubani Nikah! Let\'s take a quick tour of the platform.',
        placement: 'center',
        title: 'Welcome!',
    },
    {
        target: '#create-profile-button',
        content: 'Click here to create your free profile and start your search for a life partner.',
        title: 'Create Your Profile',
    },
    {
        target: '#browse-profiles-button',
        content: 'Or, you can start by browsing profiles from our community right away.',
        title: 'Browse Profiles',
    },
    {
        target: '#nearby-profiles-section',
        content: 'Get a glimpse of profiles from your local area right here on the homepage.',
        title: 'Discover Nearby Profiles',
    },
    {
        target: '#language-switcher',
        content: 'You can switch the language between English, Hindi, and Urdu to use the site comfortably.',
        title: 'Switch Language',
    }
];

export function AppTour() {
  const [run, setRun] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);

  React.useEffect(() => {
    const hasOnboarded = localStorage.getItem('madhubani_nikah_onboarded_tour');
    if (!hasOnboarded) {
      setRun(true);
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
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          arrowColor: 'hsl(var(--background))',
          backgroundColor: 'hsl(var(--background))',
          zIndex: 1000,
        },
        buttonClose: {
            display: 'none',
        },
        buttonNext: {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: 'var(--radius)',
        },
        buttonBack: {
            color: 'hsl(var(--foreground))',
        },
        buttonSkip: {
            color: 'hsl(var(--muted-foreground))'
        }
      }}
    />
  );
}
