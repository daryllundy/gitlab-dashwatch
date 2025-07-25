
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Settings } from '@/types';
import {
  DEFAULT_GITLAB_INSTANCES,
  DEFAULT_UPTIME_WEBSITES,
  DEFAULT_DNS_DOMAINS,
  DEFAULT_SERVER_INSTANCES,
} from '@/constants';

// Default settings
export const defaultSettings: Settings = {
  gitlab: {
    instances: [...DEFAULT_GITLAB_INSTANCES]
  },
  uptime: {
    websites: [...DEFAULT_UPTIME_WEBSITES]
  },
  dns: {
    domains: [...DEFAULT_DNS_DOMAINS]
  },
  servers: {
    instances: [...DEFAULT_SERVER_INSTANCES]
  }
};

// Function to get the user ID (assumed to be authenticated)
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Load settings from Supabase
export const loadSettings = async (): Promise<Settings> => {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      console.warn('User not authenticated, using default settings');
      return defaultSettings;
    }

    // Fetch settings from each table
    const [gitlabResponse, uptimeResponse, dnsResponse, serversResponse] = await Promise.all([
      supabase.from('gitlab_instances').select('*').eq('user_id', userId),
      supabase.from('uptime_websites').select('*').eq('user_id', userId),
      supabase.from('dns_domains').select('*').eq('user_id', userId),
      supabase.from('server_instances').select('*').eq('user_id', userId)
    ]);

    // Check for any errors
    if (gitlabResponse.error) throw gitlabResponse.error;
    if (uptimeResponse.error) throw uptimeResponse.error;
    if (dnsResponse.error) throw dnsResponse.error;
    if (serversResponse.error) throw serversResponse.error;

    // Format the data
    const settings: Settings = {
      gitlab: {
        instances: gitlabResponse.data.map(item => ({
          id: item.id,
          url: item.url,
          name: item.name,
          token: item.token
        }))
      },
      uptime: {
        websites: uptimeResponse.data.map(item => ({
          id: item.id,
          url: item.url,
          name: item.name
        }))
      },
      dns: {
        domains: dnsResponse.data.map(item => ({
          id: item.id,
          domain: item.domain,
          recordTypes: item.record_types
        }))
      },
      servers: {
        instances: serversResponse.data.map(item => ({
          id: item.id,
          name: item.name,
          ip: item.ip,
          netdataUrl: item.netdata_url
        }))
      }
    };

    // If any section is empty, use defaults
    if (settings.gitlab.instances.length === 0) settings.gitlab = defaultSettings.gitlab;
    if (settings.uptime.websites.length === 0) settings.uptime = defaultSettings.uptime;
    if (settings.dns.domains.length === 0) settings.dns = defaultSettings.dns;
    if (settings.servers.instances.length === 0) settings.servers = defaultSettings.servers;

    return settings;
  } catch (error) {
    console.error('Error loading settings from Supabase:', error);
    toast("Failed to load settings", {
      description: "Using default settings instead",
    });
    return defaultSettings;
  }
};

// Save settings to Supabase
export const saveSettings = async (settings: Settings): Promise<boolean> => {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      console.warn('User not authenticated, cannot save settings');
      toast("Authentication required", {
        description: "Please sign in to save settings",
      });
      return false;
    }

    // Delete existing records for this user
    await Promise.all([
      supabase.from('gitlab_instances').delete().eq('user_id', userId),
      supabase.from('uptime_websites').delete().eq('user_id', userId),
      supabase.from('dns_domains').delete().eq('user_id', userId),
      supabase.from('server_instances').delete().eq('user_id', userId)
    ]);

    // Insert new records
    const [gitlabResponse, uptimeResponse, dnsResponse, serversResponse] = await Promise.all([
      supabase.from('gitlab_instances').insert(
        settings.gitlab.instances.map(instance => ({
          user_id: userId,
          url: instance.url,
          name: instance.name,
          token: instance.token
        }))
      ),
      supabase.from('uptime_websites').insert(
        settings.uptime.websites.map(website => ({
          user_id: userId,
          url: website.url,
          name: website.name
        }))
      ),
      supabase.from('dns_domains').insert(
        settings.dns.domains.map(domain => ({
          user_id: userId,
          domain: domain.domain,
          record_types: domain.recordTypes
        }))
      ),
      supabase.from('server_instances').insert(
        settings.servers.instances.map(server => ({
          user_id: userId,
          name: server.name,
          ip: server.ip,
          netdata_url: server.netdataUrl
        }))
      )
    ]);

    // Check for any errors
    if (gitlabResponse.error) throw gitlabResponse.error;
    if (uptimeResponse.error) throw uptimeResponse.error;
    if (dnsResponse.error) throw dnsResponse.error;
    if (serversResponse.error) throw serversResponse.error;

    return true;
  } catch (error) {
    console.error('Error saving settings to Supabase:', error);
    toast("Failed to save settings", {
      description: "Please try again later"
    });
    return false;
  }
};
