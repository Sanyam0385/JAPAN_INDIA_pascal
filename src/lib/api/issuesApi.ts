// Issues API: Collector & staff field issue reporting
import { supabase, isBackendEnabled } from '../supabase/client';
import { INITIAL_ISSUES } from '../demo/demoData';
import type { Issue, IssueStatus } from '../../types';

let localIssues: Issue[] = [...INITIAL_ISSUES];

export const issuesApi = {
  async listIssues(): Promise<Issue[]> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (__DEV__) console.warn('[issuesApi.listIssues] Supabase error:', error);
        } else if (data) {
          return data.map((i) => ({
            id: i.id,
            raisedByRole: i.raised_by_role as any,
            raisedByUserId: i.raised_by_user_id || undefined,
            locality: i.locality || undefined,
            ward: i.ward || undefined,
            type: i.type as any,
            note: i.note,
            status: i.status as IssueStatus,
            createdAt: i.created_at,
            resolvedAt: i.resolved_at || undefined,
          }));
        }
      } catch (e) {
        if (__DEV__) console.warn('[issuesApi.listIssues] Network error:', e);
      }
    }

    return localIssues;
  },

  async createIssue(issueData: Omit<Issue, 'id' | 'createdAt' | 'status'>): Promise<Issue> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .insert({
            raised_by_role: issueData.raisedByRole,
            raised_by_user_id: issueData.raisedByUserId || (await supabase.auth.getUser()).data.user?.id,
            locality: issueData.locality || null,
            ward: issueData.ward || null,
            type: issueData.type,
            note: issueData.note,
            status: 'open',
          })
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[issuesApi.createIssue] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const created: Issue = {
            id: data.id,
            raisedByRole: data.raised_by_role as any,
            raisedByUserId: data.raised_by_user_id || undefined,
            locality: data.locality || undefined,
            ward: data.ward || undefined,
            type: data.type as any,
            note: data.note,
            status: data.status as IssueStatus,
            createdAt: data.created_at,
          };
          localIssues.unshift(created);
          return created;
        }
      } catch (e) {
        if (__DEV__) console.warn('[issuesApi.createIssue] Network error:', e);
      }
    }

    const created: Issue = {
      ...issueData,
      id: `issue-${Date.now().toString(36)}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    localIssues.unshift(created);
    return created;
  },

  async resolveIssue(issueId: string): Promise<Issue> {
    const resolvedAt = new Date().toISOString();

    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .update({
            status: 'resolved',
            resolved_at: resolvedAt,
            updated_at: resolvedAt,
          })
          .eq('id', issueId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[issuesApi.resolveIssue] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          const updated: Issue = {
            id: data.id,
            raisedByRole: data.raised_by_role as any,
            raisedByUserId: data.raised_by_user_id || undefined,
            locality: data.locality || undefined,
            ward: data.ward || undefined,
            type: data.type as any,
            note: data.note,
            status: data.status as IssueStatus,
            createdAt: data.created_at,
            resolvedAt: data.resolved_at || undefined,
          };
          const idx = localIssues.findIndex((i) => i.id === issueId);
          if (idx !== -1) localIssues[idx] = updated;
          return updated;
        }
      } catch (e) {
        if (__DEV__) console.warn('[issuesApi.resolveIssue] Network error:', e);
      }
    }

    const idx = localIssues.findIndex((i) => i.id === issueId);
    if (idx === -1) throw new Error('Issue not found');
    const updated: Issue = { ...localIssues[idx], status: 'resolved', resolvedAt };
    localIssues[idx] = updated;
    return updated;
  },
};
