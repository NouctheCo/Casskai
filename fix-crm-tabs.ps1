# Script PowerShell pour corriger les onglets CRM

$file = "src/pages/SalesCrmPage.tsx"
$content = Get-Content $file -Raw

# Remplacer l'onglet Clients
$oldClients = @'
          <TabsContent value="clients" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gestion des Clients</CardTitle>
                      <CardDescription>
                        {clients.length} clients
                      </CardDescription>
                    </div>
                    {clients.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportClientsCSV}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportClientsExcel}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Module Clients</h3>
                        <p className="text-sm text-muted-foreground">
                          Fonctionnalité complètement intégrée avec Supabase
                        </p>
                      </div>
                      <Button onClick={() => devLogger.info('Open client management')}>
                        Ouvrir la Gestion des Clients
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
'@

$newClients = @'
          <TabsContent value="clients" className="space-y-6">
            <ClientsManagement
              onExportCSV={exportClientsCSV}
              onExportExcel={exportClientsExcel}
            />
          </TabsContent>
'@

$content = $content.Replace($oldClients, $newClients)

# Remplacer l'onglet Opportunities
$oldOpportunities = @'
          <TabsContent value="opportunities" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gestion des Opportunités</CardTitle>
                      <CardDescription>
                        {opportunities.length} opportunités - Pipeline: €{conversionMetrics.total_pipeline_value.toLocaleString()}
                      </CardDescription>
                    </div>
                    {opportunities.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportPipelineReport}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Rapport Pipeline
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportOpportunitiesExcel}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Target className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Pipeline de Ventes</h3>
                        <p className="text-sm text-muted-foreground">
                          Suivi des opportunités intégré avec Supabase
                        </p>
                      </div>
                      <Button onClick={() => devLogger.info('Open opportunities')}>
                        Ouvrir le Pipeline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
'@

$newOpportunities = @'
          <TabsContent value="opportunities" className="space-y-6">
            <OpportunitiesKanban
              opportunities={opportunities}
              onCreateOpportunity={createOpportunity}
              onExportReport={exportPipelineReport}
            />
          </TabsContent>
'@

$content = $content.Replace($oldOpportunities, $newOpportunities)

# Remplacer l'onglet Actions
$oldActions = @'
          <TabsContent value="actions" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Actions Commerciales</CardTitle>
                      <CardDescription>
                        {commercialActions.length} actions
                      </CardDescription>
                    </div>
                    {commercialActions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportActionsCSV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Actions Commerciales</h3>
                        <p className="text-sm text-muted-foreground">
                          Historique et planification des actions
                        </p>
                      </div>
                      <Button onClick={() => devLogger.info('Open actions')}>
                        Ouvrir les Actions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
'@

$newActions = @'
          <TabsContent value="actions" className="space-y-6">
            <CommercialActions
              actions={commercialActions}
              onCreateAction={createCommercialAction}
              onExportCSV={exportActionsCSV}
            />
          </TabsContent>
'@

$content = $content.Replace($oldActions, $newActions)

# Sauvegarder le fichier
Set-Content -Path $file -Value $content -NoNewline

Write-Host "✅ Corrections CRM appliquées avec succès!" -ForegroundColor Green
Write-Host "   - Onglet Clients: ClientsManagement" -ForegroundColor Cyan
Write-Host "   - Onglet Opportunities: OpportunitiesKanban" -ForegroundColor Cyan
Write-Host "   - Onglet Actions: CommercialActions" -ForegroundColor Cyan
