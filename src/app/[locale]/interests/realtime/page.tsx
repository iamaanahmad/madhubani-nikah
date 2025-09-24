import { Metadata } from 'next';
import { RealtimeInterestUpdates } from '@/components/interests/realtime-interest-updates';
import { InterestStatisticsLive } from '@/components/interests/interest-statistics-live';
import { LiveActivityFeedComponent } from '@/components/interests/live-activity-feed';
import { RealtimeMatchSuggestions } from '@/components/matches/realtime-match-suggestions';

export const metadata: Metadata = {
  title: 'Real-time Interest Updates - Madhubani Nikah',
  description: 'View live interest updates, match suggestions, and activity feed in real-time',
};

export default function RealtimeInterestsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Real-time Interest Updates</h1>
        <p className="text-muted-foreground">
          Stay updated with live interest activities, AI-powered match suggestions, and real-time statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main real-time updates */}
        <div className="lg:col-span-2">
          <RealtimeInterestUpdates 
            showStats={true}
            showMatchSuggestions={true}
            showActivityFeed={true}
            maxUpdates={15}
          />
        </div>

        {/* Live statistics */}
        <div>
          <InterestStatisticsLive 
            showTrends={true}
            showProgress={true}
          />
        </div>

        {/* AI Match suggestions */}
        <div>
          <RealtimeMatchSuggestions 
            maxSuggestions={3}
            showScores={true}
            autoRefresh={true}
          />
        </div>

        {/* Live activity feed */}
        <div className="lg:col-span-2">
          <LiveActivityFeedComponent 
            maxItems={20}
            showFilters={true}
            autoScroll={true}
          />
        </div>
      </div>

      {/* Additional information */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Real-time Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-1">Live Interest Updates</h3>
            <p className="text-muted-foreground">
              Get instant notifications when interests are sent, received, accepted, or declined.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">AI Match Suggestions</h3>
            <p className="text-muted-foreground">
              Receive intelligent match recommendations based on your preferences and activity.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Live Statistics</h3>
            <p className="text-muted-foreground">
              Monitor your interest counts, success rates, and trends in real-time.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Activity Feed</h3>
            <p className="text-muted-foreground">
              Track all your matrimony activities with live updates and filtering options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}