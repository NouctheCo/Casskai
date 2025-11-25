import { supabase } from '../lib/supabase';

export class CleanupService {
  /**
   * Supprime toutes les données d'exemple/test de la base de données
   * Cela inclut les écritures comptables avec référence TEST-*
   */
  static async cleanupDemoData(companyId: string): Promise<{ success: boolean; message: string; deletedCount?: number }> {
    try {
      // Récupérer les IDs des écritures à supprimer
      const { data: entriesToDelete, error: selectError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
        .like('reference_number', 'TEST-%');

      if (selectError) {
        console.error('Erreur lors de la récupération des écritures à supprimer:', selectError);
        throw selectError;
      }

      if (!entriesToDelete || entriesToDelete.length === 0) {
        return {
          success: true,
          message: 'Aucune donnée d\'exemple trouvée à supprimer.',
          deletedCount: 0
        };
      }

      const entryIds = entriesToDelete.map(entry => entry.id);

      // Supprimer les lignes d'écritures
      const { error: itemsError } = await supabase
        .from('journal_entry_items')
        .delete()
        .in('journal_entry_id', entryIds);

      if (itemsError) {
        console.error('Erreur lors de la suppression des lignes d\'écritures:', itemsError);
        throw itemsError;
      }

      // Supprimer les écritures
      const { error: entriesError } = await supabase
        .from('journal_entries')
        .delete()
        .in('id', entryIds);

      if (entriesError) {
        console.error('Erreur lors de la suppression des écritures:', entriesError);
        throw entriesError;
      }

      return {
        success: true,
        message: `${entriesToDelete.length} écriture(s) d'exemple supprimée(s) avec succès.`,
        deletedCount: entriesToDelete.length
      };

    } catch (error) {
      console.error('Erreur lors du nettoyage des données d\'exemple:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: 'Erreur lors du nettoyage des données d\'exemple. Veuillez réessayer.'
      };
    }
  }

  /**
   * Vérifie s'il y a des données d'exemple dans la base
   */
  static async hasDemoData(companyId: string): Promise<boolean> {
    try {
      const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .like('reference_number', 'TEST-%');

      return (count || 0) > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification des données d\'exemple:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}
