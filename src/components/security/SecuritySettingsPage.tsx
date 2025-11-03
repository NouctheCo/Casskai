import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  Shield, Lock, Key, Eye, AlertTriangle, CheckCircle,
  FileText, Download, Trash2, Database
} from 'lucide-react';
import { SecuritySettings, PrivacySettings, SecurityIncident, GDPRRequest, ComplianceReport } from '@/types/security.types';
import { securityService } from '@/services/securityService';

const SecuritySettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('security');
  
  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [gdprRequests, setGDPRRequests] = useState<GDPRRequest[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);

  const companyId = 'comp-1'; // Mock company ID
  const userId = 'user-1'; // Mock user ID

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      const [security, privacy, incidents, requests] = await Promise.all([
        securityService.getSecuritySettings(companyId),
        securityService.getPrivacySettings(userId),
        securityService.getSecurityIncidents(companyId),
        securityService.getGDPRRequests(companyId)
      ]);

      setSecuritySettings(security);
      setPrivacySettings(privacy);
      setSecurityIncidents(incidents);
      setGDPRRequests(requests);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to load security data:', error instanceof Error ? error.message : String(error));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load security settings"
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, toast]);

  useEffect(() => {
    void loadSecurityData();
  }, [loadSecurityData]);

  const handleSecuritySettingsUpdate = async (updates: Partial<SecuritySettings>) => {
    if (!securitySettings) return;

    try {
      await securityService.updateSecuritySettings(updates);
      setSecuritySettings({ ...securitySettings, ...updates });
      toast({
        title: "Security Settings Updated",
        description: "Your security settings have been saved successfully.",
        action: <CheckCircle className="text-green-500" />
      });
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update security settings"
      });
    }
  };

  const handlePrivacySettingsUpdate = async (updates: Partial<PrivacySettings>) => {
    if (!privacySettings) return;

    try {
      await securityService.updatePrivacySettings(userId, updates);
      setPrivacySettings({ ...privacySettings, ...updates });
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved.",
        action: <CheckCircle className="text-green-500" />
      });
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update privacy settings"
      });
    }
  };

  const handleDataExportRequest = async () => {
    try {
      const data = await securityService.exportUserData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casskai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Export Complete",
        description: "Your personal data has been exported successfully.",
        action: <Download className="text-blue-500" />
      });
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export your data"
      });
    }
  };

  const handleDataDeletionRequest = async () => {
    try {
      await securityService.deleteUserData(userId);
      await securityService.createGDPRRequest(userId, companyId, 'erasure', 'User requested complete data deletion');
      
      toast({
        title: "Data Deletion Requested",
        description: "Your data deletion request has been submitted and will be processed within 30 days.",
        action: <Trash2 className="text-orange-500" />
      });
      
      // Reload GDPR requests to show the new request
      const requests = await securityService.getGDPRRequests(companyId);
      setGDPRRequests(requests);
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Failed to submit data deletion request"
      });
    }
  };

  const generateComplianceReport = async () => {
    try {
      const report = await securityService.generateComplianceReport(companyId);
      setComplianceReport(report);
      toast({
        title: "Compliance Report Generated",
        description: "Your security compliance report is ready.",
        action: <FileText className="text-blue-500" />
      });
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: "Failed to generate compliance report"
      });
    }
  };

  const getSecurityScore = () => {
    if (!securitySettings) return 0;
    
    let score = 70; // Base score
    if (securitySettings.twoFactorRequired) score += 15;
    if (securitySettings.encryptionLevel === 'maximum') score += 10;
    if (securitySettings.auditLogEnabled) score += 5;
    
    return Math.min(100, score);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 md:p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Security & Privacy
          </h1>
          <Badge variant="outline" className="text-sm">
            Score: <span className={getSecurityScoreColor(getSecurityScore())}>{getSecurityScore()}%</span>
          </Badge>
        </div>
        <Button onClick={generateComplianceReport} className="flex items-center gap-2 mt-4 sm:mt-0">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            GDPR
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Monitor and configure your security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className={`text-2xl font-bold ${getSecurityScoreColor(getSecurityScore())}`}>
                    {getSecurityScore()}%
                  </div>
                  <div className="text-sm text-muted-foreground">Security Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {securityIncidents.filter(i => i.status === 'open').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Open Incidents</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {securitySettings?.auditLogEnabled ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-sm text-muted-foreground">Audit Logging</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all user accounts
                  </p>
                </div>
                <Switch
                  checked={securitySettings?.twoFactorRequired || false}
                  onCheckedChange={(checked) => 
                    handleSecuritySettingsUpdate({ twoFactorRequired: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={securitySettings?.sessionTimeout || 480}
                  onChange={(e) => 
                    handleSecuritySettingsUpdate({ sessionTimeout: parseInt(e.target.value) })
                  }
                  className="w-32"
                />
              </div>

              <div className="space-y-2">
                <Label>Encryption Level</Label>
                <Select
                  value={securitySettings?.encryptionLevel || 'high'}
                  onValueChange={(value: 'standard' | 'high' | 'maximum') =>
                    handleSecuritySettingsUpdate({ encryptionLevel: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="maximum">Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Length</Label>
                  <Input
                    type="number"
                    value={securitySettings?.passwordPolicy.minLength || 8}
                    onChange={(e) => {
                      const policy = { ...securitySettings?.passwordPolicy, minLength: parseInt(e.target.value) };
                      handleSecuritySettingsUpdate({ passwordPolicy: policy });
                    }}
                    className="w-20"
                  />
                </div>
                <div>
                  <Label>Password Age (days)</Label>
                  <Input
                    type="number"
                    value={securitySettings?.passwordPolicy.maxAge || 90}
                    onChange={(e) => {
                      const policy = { ...securitySettings?.passwordPolicy, maxAge: parseInt(e.target.value) };
                      handleSecuritySettingsUpdate({ passwordPolicy: policy });
                    }}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'requireUppercase', label: 'Require Uppercase Letters' },
                  { key: 'requireLowercase', label: 'Require Lowercase Letters' },
                  { key: 'requireNumbers', label: 'Require Numbers' },
                  { key: 'requireSpecialChars', label: 'Require Special Characters' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch
                      checked={!!(securitySettings?.passwordPolicy[key as keyof typeof securitySettings.passwordPolicy])}
                      onCheckedChange={(checked) => {
                        const policy = { ...securitySettings?.passwordPolicy, [key]: checked };
                        handleSecuritySettingsUpdate({ passwordPolicy: policy });
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy Preferences
              </CardTitle>
              <CardDescription>
                Control how your data is used and shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { 
                  key: 'dataProcessingConsent', 
                  label: 'Data Processing', 
                  description: 'Allow processing of personal data for service provision' 
                },
                { 
                  key: 'marketingConsent', 
                  label: 'Marketing Communications', 
                  description: 'Receive marketing emails and promotional content' 
                },
                { 
                  key: 'analyticsConsent', 
                  label: 'Analytics & Performance', 
                  description: 'Help improve our services through usage analytics' 
                },
                { 
                  key: 'thirdPartySharing', 
                  label: 'Third-Party Sharing', 
                  description: 'Share data with trusted partners for enhanced features' 
                }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                  <Switch
                    checked={privacySettings?.[key as keyof PrivacySettings] as boolean || false}
                    onCheckedChange={(checked) => 
                      handlePrivacySettingsUpdate({ [key]: checked })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or delete your personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDataExportRequest} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export My Data
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDataDeletionRequest}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Request Data Deletion
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Data export includes all your personal information. Data deletion requests are processed within 30 days and cannot be undone.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-6">
          {/* GDPR Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GDPR Requests
              </CardTitle>
              <CardDescription>
                Track your data subject rights requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gdprRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No GDPR requests have been submitted
                </div>
              ) : (
                <div className="space-y-4">
                  {gdprRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium capitalize">{request.type} Request</div>
                          <div className="text-sm text-muted-foreground">
                            Submitted: {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(request.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={
                          request.status === 'completed' ? 'default' : 
                          request.status === 'processing' ? 'secondary' : 'outline'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">{request.requestDetails}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          {/* Security Incidents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Incidents
              </CardTitle>
              <CardDescription>
                Monitor and track security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityIncidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  No security incidents reported
                </div>
              ) : (
                <div className="space-y-4">
                  {securityIncidents.map((incident) => (
                    <div key={incident.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{incident.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {incident.type} • {new Date(incident.reportedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            incident.severity === 'critical' ? 'destructive' :
                            incident.severity === 'high' ? 'secondary' : 'outline'
                          }>
                            {incident.severity}
                          </Badge>
                          <Badge variant={
                            incident.status === 'resolved' ? 'default' : 'outline'
                          }>
                            {incident.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">{incident.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Report
              </CardTitle>
              <CardDescription>
                Review your security and privacy compliance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!complianceReport ? (
                <div className="text-center py-8">
                  <Button onClick={generateComplianceReport} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Generate Compliance Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">Overall Compliance Score</div>
                      <div className="text-sm text-muted-foreground">
                        Report generated on {new Date(complianceReport.generatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${getSecurityScoreColor(complianceReport.overallScore)}`}>
                      {complianceReport.overallScore}%
                    </div>
                  </div>

                  {complianceReport.findings.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4">Findings</h3>
                      <div className="space-y-3">
                        {complianceReport.findings.map((finding) => (
                          <div key={finding.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{finding.title}</div>
                                <div className="text-sm text-muted-foreground">{finding.description}</div>
                                <div className="text-sm mt-2">
                                  <strong>Recommendation:</strong> {finding.recommendation}
                                </div>
                              </div>
                              <Badge variant={
                                finding.severity === 'critical' ? 'destructive' :
                                finding.severity === 'warning' ? 'secondary' : 'outline'
                              }>
                                {finding.severity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {complianceReport.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4">Recommendations</h3>
                      <ul className="space-y-2">
                        {complianceReport.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SecuritySettingsPage;