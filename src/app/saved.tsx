import { Screen } from '@/components/screen';
import { OpportunityCard } from '@/components/opportunity-card';
import { MessageState } from '@/components/states';
import { useApp } from '@/providers/app-provider';

export default function SavedScreen() { const { feed } = useApp(); const saved = feed?.opportunities.filter((item) => item.saved) ?? []; return <Screen title="Saved opportunities">{saved.map((item) => <OpportunityCard key={item.id} item={item} />)}{!saved.length ? <MessageState title="Nothing saved yet" body="Tap Save on an opportunity to build a shortlist." /> : null}</Screen>; }
