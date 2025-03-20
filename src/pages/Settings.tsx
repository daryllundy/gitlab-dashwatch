import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Globe, Server, Gitlab, Database } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const Settings = () => {
  const { settings: savedSettings, saveSettings, isLoading } = useSettings();
  const [settings, setSettings] = useState(savedSettings);
  const [activeTab, setActiveTab] = useState("gitlab");
  const navigate = useNavigate();

  // Update local settings when savedSettings changes
  useEffect(() => {
    setSettings(savedSettings);
  }, [savedSettings]);

  // Generic function to add an item to any settings category
  const addItem = (category, itemTemplate) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [Array.isArray(prev[category]) ? 'items' : Object.keys(prev[category])[0]]: [
          ...prev[category][Object.keys(prev[category])[0]],
          itemTemplate
        ]
      }
    }));
  };

  // Generic function to remove an item from any settings category
  const removeItem = (category, arrayKey, index) => {
    setSettings(prev => {
      const newArray = [...prev[category][arrayKey]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [arrayKey]: newArray
        }
      };
    });
  };

  // Generic function to update a specific item's property
  const updateItemProperty = (category, arrayKey, index, property, value) => {
    setSettings(prev => {
      const newArray = [...prev[category][arrayKey]];
      newArray[index] = { ...newArray[index], [property]: value };
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [arrayKey]: newArray
        }
      };
    });
  };

  const handleSaveSettings = async () => {
    await saveSettings(settings);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-slide-in">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your monitoring dashboard
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gitlab" className="flex items-center gap-2">
              <Gitlab className="h-4 w-4" />
              <span>GitLab Projects</span>
            </TabsTrigger>
            <TabsTrigger value="uptime" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Website Uptime</span>
            </TabsTrigger>
            <TabsTrigger value="dns" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>DNS Records</span>
            </TabsTrigger>
            <TabsTrigger value="servers" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>Server Monitoring</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gitlab" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>GitLab Instances</CardTitle>
                <CardDescription>
                  Configure your self-hosted GitLab instances to monitor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.gitlab.instances.map((instance, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`gitlab-name-${index}`}>Instance Name</Label>
                        <Input
                          id={`gitlab-name-${index}`}
                          value={instance.name}
                          onChange={(e) => updateItemProperty('gitlab', 'instances', index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`gitlab-url-${index}`}>GitLab URL</Label>
                        <Input
                          id={`gitlab-url-${index}`}
                          value={instance.url}
                          onChange={(e) => updateItemProperty('gitlab', 'instances', index, 'url', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`gitlab-token-${index}`}>API Token (optional)</Label>
                      <Input
                        id={`gitlab-token-${index}`}
                        type="password"
                        value={instance.token}
                        onChange={(e) => updateItemProperty('gitlab', 'instances', index, 'token', e.target.value)}
                        placeholder="Personal access token for private repositories"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem('gitlab', 'instances', index)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => addItem('gitlab', { url: '', name: 'New GitLab Instance', token: '' })}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add GitLab Instance
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uptime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Website Uptime Monitoring</CardTitle>
                <CardDescription>
                  Add websites to monitor for uptime and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.uptime.websites.map((website, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`website-name-${index}`}>Website Name</Label>
                        <Input
                          id={`website-name-${index}`}
                          value={website.name}
                          onChange={(e) => updateItemProperty('uptime', 'websites', index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`website-url-${index}`}>Website URL</Label>
                        <Input
                          id={`website-url-${index}`}
                          value={website.url}
                          onChange={(e) => updateItemProperty('uptime', 'websites', index, 'url', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem('uptime', 'websites', index)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => addItem('uptime', { url: '', name: 'New Website' })}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Website
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DNS Record Monitoring</CardTitle>
                <CardDescription>
                  Configure domains and record types to monitor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.dns.domains.map((domain, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`domain-name-${index}`}>Domain Name</Label>
                        <Input
                          id={`domain-name-${index}`}
                          value={domain.domain}
                          onChange={(e) => updateItemProperty('dns', 'domains', index, 'domain', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`domain-records-${index}`}>Record Types (comma-separated)</Label>
                        <Input
                          id={`domain-records-${index}`}
                          value={domain.recordTypes.join(',')}
                          onChange={(e) => {
                            const recordTypes = e.target.value.split(',').map(type => type.trim());
                            updateItemProperty('dns', 'domains', index, 'recordTypes', recordTypes);
                          }}
                          placeholder="A,CNAME,MX,TXT"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem('dns', 'domains', index)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => addItem('dns', { domain: '', recordTypes: ['A'] })}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Domain
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Server Monitoring</CardTitle>
                <CardDescription>
                  Configure servers with Netdata for real-time monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.servers.instances.map((server, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`server-name-${index}`}>Server Name</Label>
                        <Input
                          id={`server-name-${index}`}
                          value={server.name}
                          onChange={(e) => updateItemProperty('servers', 'instances', index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`server-ip-${index}`}>Server IP</Label>
                        <Input
                          id={`server-ip-${index}`}
                          value={server.ip}
                          onChange={(e) => updateItemProperty('servers', 'instances', index, 'ip', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`server-netdata-${index}`}>Netdata URL</Label>
                      <Input
                        id={`server-netdata-${index}`}
                        value={server.netdataUrl}
                        onChange={(e) => updateItemProperty('servers', 'instances', index, 'netdataUrl', e.target.value)}
                        placeholder="http://ip-address:19999"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Default Netdata port is 19999. URL should include protocol (http/https).
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem('servers', 'instances', index)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => addItem('servers', { name: 'New Server', ip: '', netdataUrl: '' })}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Server
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings} 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
