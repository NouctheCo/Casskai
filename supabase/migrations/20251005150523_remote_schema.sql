create extension if not exists "btree_gin" with schema "public" version '1.3';

revoke delete on table "public"."accounting_periods" from "anon";

revoke insert on table "public"."accounting_periods" from "anon";

revoke references on table "public"."accounting_periods" from "anon";

revoke select on table "public"."accounting_periods" from "anon";

revoke trigger on table "public"."accounting_periods" from "anon";

revoke truncate on table "public"."accounting_periods" from "anon";

revoke update on table "public"."accounting_periods" from "anon";

revoke delete on table "public"."accounting_periods" from "authenticated";

revoke insert on table "public"."accounting_periods" from "authenticated";

revoke references on table "public"."accounting_periods" from "authenticated";

revoke select on table "public"."accounting_periods" from "authenticated";

revoke trigger on table "public"."accounting_periods" from "authenticated";

revoke truncate on table "public"."accounting_periods" from "authenticated";

revoke update on table "public"."accounting_periods" from "authenticated";

revoke delete on table "public"."accounting_periods" from "service_role";

revoke insert on table "public"."accounting_periods" from "service_role";

revoke references on table "public"."accounting_periods" from "service_role";

revoke select on table "public"."accounting_periods" from "service_role";

revoke trigger on table "public"."accounting_periods" from "service_role";

revoke truncate on table "public"."accounting_periods" from "service_role";

revoke update on table "public"."accounting_periods" from "service_role";

revoke delete on table "public"."accounts" from "anon";

revoke insert on table "public"."accounts" from "anon";

revoke references on table "public"."accounts" from "anon";

revoke select on table "public"."accounts" from "anon";

revoke trigger on table "public"."accounts" from "anon";

revoke truncate on table "public"."accounts" from "anon";

revoke update on table "public"."accounts" from "anon";

revoke delete on table "public"."accounts" from "authenticated";

revoke insert on table "public"."accounts" from "authenticated";

revoke references on table "public"."accounts" from "authenticated";

revoke select on table "public"."accounts" from "authenticated";

revoke trigger on table "public"."accounts" from "authenticated";

revoke truncate on table "public"."accounts" from "authenticated";

revoke update on table "public"."accounts" from "authenticated";

revoke delete on table "public"."accounts" from "service_role";

revoke insert on table "public"."accounts" from "service_role";

revoke references on table "public"."accounts" from "service_role";

revoke select on table "public"."accounts" from "service_role";

revoke trigger on table "public"."accounts" from "service_role";

revoke truncate on table "public"."accounts" from "service_role";

revoke update on table "public"."accounts" from "service_role";

revoke delete on table "public"."ai_insights" from "anon";

revoke insert on table "public"."ai_insights" from "anon";

revoke references on table "public"."ai_insights" from "anon";

revoke select on table "public"."ai_insights" from "anon";

revoke trigger on table "public"."ai_insights" from "anon";

revoke truncate on table "public"."ai_insights" from "anon";

revoke update on table "public"."ai_insights" from "anon";

revoke delete on table "public"."ai_insights" from "authenticated";

revoke insert on table "public"."ai_insights" from "authenticated";

revoke references on table "public"."ai_insights" from "authenticated";

revoke select on table "public"."ai_insights" from "authenticated";

revoke trigger on table "public"."ai_insights" from "authenticated";

revoke truncate on table "public"."ai_insights" from "authenticated";

revoke update on table "public"."ai_insights" from "authenticated";

revoke delete on table "public"."ai_insights" from "service_role";

revoke insert on table "public"."ai_insights" from "service_role";

revoke references on table "public"."ai_insights" from "service_role";

revoke select on table "public"."ai_insights" from "service_role";

revoke trigger on table "public"."ai_insights" from "service_role";

revoke truncate on table "public"."ai_insights" from "service_role";

revoke update on table "public"."ai_insights" from "service_role";

revoke delete on table "public"."ai_interactions" from "anon";

revoke insert on table "public"."ai_interactions" from "anon";

revoke references on table "public"."ai_interactions" from "anon";

revoke select on table "public"."ai_interactions" from "anon";

revoke trigger on table "public"."ai_interactions" from "anon";

revoke truncate on table "public"."ai_interactions" from "anon";

revoke update on table "public"."ai_interactions" from "anon";

revoke delete on table "public"."ai_interactions" from "authenticated";

revoke insert on table "public"."ai_interactions" from "authenticated";

revoke references on table "public"."ai_interactions" from "authenticated";

revoke select on table "public"."ai_interactions" from "authenticated";

revoke trigger on table "public"."ai_interactions" from "authenticated";

revoke truncate on table "public"."ai_interactions" from "authenticated";

revoke update on table "public"."ai_interactions" from "authenticated";

revoke delete on table "public"."ai_interactions" from "service_role";

revoke insert on table "public"."ai_interactions" from "service_role";

revoke references on table "public"."ai_interactions" from "service_role";

revoke select on table "public"."ai_interactions" from "service_role";

revoke trigger on table "public"."ai_interactions" from "service_role";

revoke truncate on table "public"."ai_interactions" from "service_role";

revoke update on table "public"."ai_interactions" from "service_role";

revoke delete on table "public"."ai_performance_metrics" from "anon";

revoke insert on table "public"."ai_performance_metrics" from "anon";

revoke references on table "public"."ai_performance_metrics" from "anon";

revoke select on table "public"."ai_performance_metrics" from "anon";

revoke trigger on table "public"."ai_performance_metrics" from "anon";

revoke truncate on table "public"."ai_performance_metrics" from "anon";

revoke update on table "public"."ai_performance_metrics" from "anon";

revoke delete on table "public"."ai_performance_metrics" from "authenticated";

revoke insert on table "public"."ai_performance_metrics" from "authenticated";

revoke references on table "public"."ai_performance_metrics" from "authenticated";

revoke select on table "public"."ai_performance_metrics" from "authenticated";

revoke trigger on table "public"."ai_performance_metrics" from "authenticated";

revoke truncate on table "public"."ai_performance_metrics" from "authenticated";

revoke update on table "public"."ai_performance_metrics" from "authenticated";

revoke delete on table "public"."ai_performance_metrics" from "service_role";

revoke insert on table "public"."ai_performance_metrics" from "service_role";

revoke references on table "public"."ai_performance_metrics" from "service_role";

revoke select on table "public"."ai_performance_metrics" from "service_role";

revoke trigger on table "public"."ai_performance_metrics" from "service_role";

revoke truncate on table "public"."ai_performance_metrics" from "service_role";

revoke update on table "public"."ai_performance_metrics" from "service_role";

revoke delete on table "public"."alert_configurations" from "anon";

revoke insert on table "public"."alert_configurations" from "anon";

revoke references on table "public"."alert_configurations" from "anon";

revoke select on table "public"."alert_configurations" from "anon";

revoke trigger on table "public"."alert_configurations" from "anon";

revoke truncate on table "public"."alert_configurations" from "anon";

revoke update on table "public"."alert_configurations" from "anon";

revoke delete on table "public"."alert_configurations" from "authenticated";

revoke insert on table "public"."alert_configurations" from "authenticated";

revoke references on table "public"."alert_configurations" from "authenticated";

revoke select on table "public"."alert_configurations" from "authenticated";

revoke trigger on table "public"."alert_configurations" from "authenticated";

revoke truncate on table "public"."alert_configurations" from "authenticated";

revoke update on table "public"."alert_configurations" from "authenticated";

revoke delete on table "public"."alert_configurations" from "service_role";

revoke insert on table "public"."alert_configurations" from "service_role";

revoke references on table "public"."alert_configurations" from "service_role";

revoke select on table "public"."alert_configurations" from "service_role";

revoke trigger on table "public"."alert_configurations" from "service_role";

revoke truncate on table "public"."alert_configurations" from "service_role";

revoke update on table "public"."alert_configurations" from "service_role";

revoke delete on table "public"."analytical_distributions" from "anon";

revoke insert on table "public"."analytical_distributions" from "anon";

revoke references on table "public"."analytical_distributions" from "anon";

revoke select on table "public"."analytical_distributions" from "anon";

revoke trigger on table "public"."analytical_distributions" from "anon";

revoke truncate on table "public"."analytical_distributions" from "anon";

revoke update on table "public"."analytical_distributions" from "anon";

revoke delete on table "public"."analytical_distributions" from "authenticated";

revoke insert on table "public"."analytical_distributions" from "authenticated";

revoke references on table "public"."analytical_distributions" from "authenticated";

revoke select on table "public"."analytical_distributions" from "authenticated";

revoke trigger on table "public"."analytical_distributions" from "authenticated";

revoke truncate on table "public"."analytical_distributions" from "authenticated";

revoke update on table "public"."analytical_distributions" from "authenticated";

revoke delete on table "public"."analytical_distributions" from "service_role";

revoke insert on table "public"."analytical_distributions" from "service_role";

revoke references on table "public"."analytical_distributions" from "service_role";

revoke select on table "public"."analytical_distributions" from "service_role";

revoke trigger on table "public"."analytical_distributions" from "service_role";

revoke truncate on table "public"."analytical_distributions" from "service_role";

revoke update on table "public"."analytical_distributions" from "service_role";

revoke delete on table "public"."anomaly_detections" from "anon";

revoke insert on table "public"."anomaly_detections" from "anon";

revoke references on table "public"."anomaly_detections" from "anon";

revoke select on table "public"."anomaly_detections" from "anon";

revoke trigger on table "public"."anomaly_detections" from "anon";

revoke truncate on table "public"."anomaly_detections" from "anon";

revoke update on table "public"."anomaly_detections" from "anon";

revoke delete on table "public"."anomaly_detections" from "authenticated";

revoke insert on table "public"."anomaly_detections" from "authenticated";

revoke references on table "public"."anomaly_detections" from "authenticated";

revoke select on table "public"."anomaly_detections" from "authenticated";

revoke trigger on table "public"."anomaly_detections" from "authenticated";

revoke truncate on table "public"."anomaly_detections" from "authenticated";

revoke update on table "public"."anomaly_detections" from "authenticated";

revoke delete on table "public"."anomaly_detections" from "service_role";

revoke insert on table "public"."anomaly_detections" from "service_role";

revoke references on table "public"."anomaly_detections" from "service_role";

revoke select on table "public"."anomaly_detections" from "service_role";

revoke trigger on table "public"."anomaly_detections" from "service_role";

revoke truncate on table "public"."anomaly_detections" from "service_role";

revoke update on table "public"."anomaly_detections" from "service_role";

revoke delete on table "public"."api_configurations" from "anon";

revoke insert on table "public"."api_configurations" from "anon";

revoke references on table "public"."api_configurations" from "anon";

revoke select on table "public"."api_configurations" from "anon";

revoke trigger on table "public"."api_configurations" from "anon";

revoke truncate on table "public"."api_configurations" from "anon";

revoke update on table "public"."api_configurations" from "anon";

revoke delete on table "public"."api_configurations" from "authenticated";

revoke insert on table "public"."api_configurations" from "authenticated";

revoke references on table "public"."api_configurations" from "authenticated";

revoke select on table "public"."api_configurations" from "authenticated";

revoke trigger on table "public"."api_configurations" from "authenticated";

revoke truncate on table "public"."api_configurations" from "authenticated";

revoke update on table "public"."api_configurations" from "authenticated";

revoke delete on table "public"."api_configurations" from "service_role";

revoke insert on table "public"."api_configurations" from "service_role";

revoke references on table "public"."api_configurations" from "service_role";

revoke select on table "public"."api_configurations" from "service_role";

revoke trigger on table "public"."api_configurations" from "service_role";

revoke truncate on table "public"."api_configurations" from "service_role";

revoke update on table "public"."api_configurations" from "service_role";

revoke delete on table "public"."attendance" from "anon";

revoke insert on table "public"."attendance" from "anon";

revoke references on table "public"."attendance" from "anon";

revoke select on table "public"."attendance" from "anon";

revoke trigger on table "public"."attendance" from "anon";

revoke truncate on table "public"."attendance" from "anon";

revoke update on table "public"."attendance" from "anon";

revoke delete on table "public"."attendance" from "authenticated";

revoke insert on table "public"."attendance" from "authenticated";

revoke references on table "public"."attendance" from "authenticated";

revoke select on table "public"."attendance" from "authenticated";

revoke trigger on table "public"."attendance" from "authenticated";

revoke truncate on table "public"."attendance" from "authenticated";

revoke update on table "public"."attendance" from "authenticated";

revoke delete on table "public"."attendance" from "service_role";

revoke insert on table "public"."attendance" from "service_role";

revoke references on table "public"."attendance" from "service_role";

revoke select on table "public"."attendance" from "service_role";

revoke trigger on table "public"."attendance" from "service_role";

revoke truncate on table "public"."attendance" from "service_role";

revoke update on table "public"."attendance" from "service_role";

revoke delete on table "public"."audit_logs" from "anon";

revoke insert on table "public"."audit_logs" from "anon";

revoke references on table "public"."audit_logs" from "anon";

revoke select on table "public"."audit_logs" from "anon";

revoke trigger on table "public"."audit_logs" from "anon";

revoke truncate on table "public"."audit_logs" from "anon";

revoke update on table "public"."audit_logs" from "anon";

revoke delete on table "public"."audit_logs" from "authenticated";

revoke insert on table "public"."audit_logs" from "authenticated";

revoke references on table "public"."audit_logs" from "authenticated";

revoke select on table "public"."audit_logs" from "authenticated";

revoke trigger on table "public"."audit_logs" from "authenticated";

revoke truncate on table "public"."audit_logs" from "authenticated";

revoke update on table "public"."audit_logs" from "authenticated";

revoke delete on table "public"."audit_logs" from "service_role";

revoke insert on table "public"."audit_logs" from "service_role";

revoke references on table "public"."audit_logs" from "service_role";

revoke select on table "public"."audit_logs" from "service_role";

revoke trigger on table "public"."audit_logs" from "service_role";

revoke truncate on table "public"."audit_logs" from "service_role";

revoke update on table "public"."audit_logs" from "service_role";

revoke delete on table "public"."automation_rules" from "anon";

revoke insert on table "public"."automation_rules" from "anon";

revoke references on table "public"."automation_rules" from "anon";

revoke select on table "public"."automation_rules" from "anon";

revoke trigger on table "public"."automation_rules" from "anon";

revoke truncate on table "public"."automation_rules" from "anon";

revoke update on table "public"."automation_rules" from "anon";

revoke delete on table "public"."automation_rules" from "authenticated";

revoke insert on table "public"."automation_rules" from "authenticated";

revoke references on table "public"."automation_rules" from "authenticated";

revoke select on table "public"."automation_rules" from "authenticated";

revoke trigger on table "public"."automation_rules" from "authenticated";

revoke truncate on table "public"."automation_rules" from "authenticated";

revoke update on table "public"."automation_rules" from "authenticated";

revoke delete on table "public"."automation_rules" from "service_role";

revoke insert on table "public"."automation_rules" from "service_role";

revoke references on table "public"."automation_rules" from "service_role";

revoke select on table "public"."automation_rules" from "service_role";

revoke trigger on table "public"."automation_rules" from "service_role";

revoke truncate on table "public"."automation_rules" from "service_role";

revoke update on table "public"."automation_rules" from "service_role";

revoke delete on table "public"."available_features" from "anon";

revoke insert on table "public"."available_features" from "anon";

revoke references on table "public"."available_features" from "anon";

revoke select on table "public"."available_features" from "anon";

revoke trigger on table "public"."available_features" from "anon";

revoke truncate on table "public"."available_features" from "anon";

revoke update on table "public"."available_features" from "anon";

revoke delete on table "public"."available_features" from "authenticated";

revoke insert on table "public"."available_features" from "authenticated";

revoke references on table "public"."available_features" from "authenticated";

revoke select on table "public"."available_features" from "authenticated";

revoke trigger on table "public"."available_features" from "authenticated";

revoke truncate on table "public"."available_features" from "authenticated";

revoke update on table "public"."available_features" from "authenticated";

revoke delete on table "public"."available_features" from "service_role";

revoke insert on table "public"."available_features" from "service_role";

revoke references on table "public"."available_features" from "service_role";

revoke select on table "public"."available_features" from "service_role";

revoke trigger on table "public"."available_features" from "service_role";

revoke truncate on table "public"."available_features" from "service_role";

revoke update on table "public"."available_features" from "service_role";

revoke delete on table "public"."backup_configurations" from "anon";

revoke insert on table "public"."backup_configurations" from "anon";

revoke references on table "public"."backup_configurations" from "anon";

revoke select on table "public"."backup_configurations" from "anon";

revoke trigger on table "public"."backup_configurations" from "anon";

revoke truncate on table "public"."backup_configurations" from "anon";

revoke update on table "public"."backup_configurations" from "anon";

revoke delete on table "public"."backup_configurations" from "authenticated";

revoke insert on table "public"."backup_configurations" from "authenticated";

revoke references on table "public"."backup_configurations" from "authenticated";

revoke select on table "public"."backup_configurations" from "authenticated";

revoke trigger on table "public"."backup_configurations" from "authenticated";

revoke truncate on table "public"."backup_configurations" from "authenticated";

revoke update on table "public"."backup_configurations" from "authenticated";

revoke delete on table "public"."backup_configurations" from "service_role";

revoke insert on table "public"."backup_configurations" from "service_role";

revoke references on table "public"."backup_configurations" from "service_role";

revoke select on table "public"."backup_configurations" from "service_role";

revoke trigger on table "public"."backup_configurations" from "service_role";

revoke truncate on table "public"."backup_configurations" from "service_role";

revoke update on table "public"."backup_configurations" from "service_role";

revoke delete on table "public"."bank_accounts" from "anon";

revoke insert on table "public"."bank_accounts" from "anon";

revoke references on table "public"."bank_accounts" from "anon";

revoke select on table "public"."bank_accounts" from "anon";

revoke trigger on table "public"."bank_accounts" from "anon";

revoke truncate on table "public"."bank_accounts" from "anon";

revoke update on table "public"."bank_accounts" from "anon";

revoke delete on table "public"."bank_accounts" from "authenticated";

revoke insert on table "public"."bank_accounts" from "authenticated";

revoke references on table "public"."bank_accounts" from "authenticated";

revoke select on table "public"."bank_accounts" from "authenticated";

revoke trigger on table "public"."bank_accounts" from "authenticated";

revoke truncate on table "public"."bank_accounts" from "authenticated";

revoke update on table "public"."bank_accounts" from "authenticated";

revoke delete on table "public"."bank_accounts" from "service_role";

revoke insert on table "public"."bank_accounts" from "service_role";

revoke references on table "public"."bank_accounts" from "service_role";

revoke select on table "public"."bank_accounts" from "service_role";

revoke trigger on table "public"."bank_accounts" from "service_role";

revoke truncate on table "public"."bank_accounts" from "service_role";

revoke update on table "public"."bank_accounts" from "service_role";

revoke delete on table "public"."bank_alert_rules" from "anon";

revoke insert on table "public"."bank_alert_rules" from "anon";

revoke references on table "public"."bank_alert_rules" from "anon";

revoke select on table "public"."bank_alert_rules" from "anon";

revoke trigger on table "public"."bank_alert_rules" from "anon";

revoke truncate on table "public"."bank_alert_rules" from "anon";

revoke update on table "public"."bank_alert_rules" from "anon";

revoke delete on table "public"."bank_alert_rules" from "authenticated";

revoke insert on table "public"."bank_alert_rules" from "authenticated";

revoke references on table "public"."bank_alert_rules" from "authenticated";

revoke select on table "public"."bank_alert_rules" from "authenticated";

revoke trigger on table "public"."bank_alert_rules" from "authenticated";

revoke truncate on table "public"."bank_alert_rules" from "authenticated";

revoke update on table "public"."bank_alert_rules" from "authenticated";

revoke delete on table "public"."bank_alert_rules" from "service_role";

revoke insert on table "public"."bank_alert_rules" from "service_role";

revoke references on table "public"."bank_alert_rules" from "service_role";

revoke select on table "public"."bank_alert_rules" from "service_role";

revoke trigger on table "public"."bank_alert_rules" from "service_role";

revoke truncate on table "public"."bank_alert_rules" from "service_role";

revoke update on table "public"."bank_alert_rules" from "service_role";

revoke delete on table "public"."bank_audit_logs" from "anon";

revoke insert on table "public"."bank_audit_logs" from "anon";

revoke references on table "public"."bank_audit_logs" from "anon";

revoke select on table "public"."bank_audit_logs" from "anon";

revoke trigger on table "public"."bank_audit_logs" from "anon";

revoke truncate on table "public"."bank_audit_logs" from "anon";

revoke update on table "public"."bank_audit_logs" from "anon";

revoke delete on table "public"."bank_audit_logs" from "authenticated";

revoke insert on table "public"."bank_audit_logs" from "authenticated";

revoke references on table "public"."bank_audit_logs" from "authenticated";

revoke select on table "public"."bank_audit_logs" from "authenticated";

revoke trigger on table "public"."bank_audit_logs" from "authenticated";

revoke truncate on table "public"."bank_audit_logs" from "authenticated";

revoke update on table "public"."bank_audit_logs" from "authenticated";

revoke delete on table "public"."bank_audit_logs" from "service_role";

revoke insert on table "public"."bank_audit_logs" from "service_role";

revoke references on table "public"."bank_audit_logs" from "service_role";

revoke select on table "public"."bank_audit_logs" from "service_role";

revoke trigger on table "public"."bank_audit_logs" from "service_role";

revoke truncate on table "public"."bank_audit_logs" from "service_role";

revoke update on table "public"."bank_audit_logs" from "service_role";

revoke delete on table "public"."bank_auth_flows" from "anon";

revoke insert on table "public"."bank_auth_flows" from "anon";

revoke references on table "public"."bank_auth_flows" from "anon";

revoke select on table "public"."bank_auth_flows" from "anon";

revoke trigger on table "public"."bank_auth_flows" from "anon";

revoke truncate on table "public"."bank_auth_flows" from "anon";

revoke update on table "public"."bank_auth_flows" from "anon";

revoke delete on table "public"."bank_auth_flows" from "authenticated";

revoke insert on table "public"."bank_auth_flows" from "authenticated";

revoke references on table "public"."bank_auth_flows" from "authenticated";

revoke select on table "public"."bank_auth_flows" from "authenticated";

revoke trigger on table "public"."bank_auth_flows" from "authenticated";

revoke truncate on table "public"."bank_auth_flows" from "authenticated";

revoke update on table "public"."bank_auth_flows" from "authenticated";

revoke delete on table "public"."bank_auth_flows" from "service_role";

revoke insert on table "public"."bank_auth_flows" from "service_role";

revoke references on table "public"."bank_auth_flows" from "service_role";

revoke select on table "public"."bank_auth_flows" from "service_role";

revoke trigger on table "public"."bank_auth_flows" from "service_role";

revoke truncate on table "public"."bank_auth_flows" from "service_role";

revoke update on table "public"."bank_auth_flows" from "service_role";

revoke delete on table "public"."bank_balance_forecasts" from "anon";

revoke insert on table "public"."bank_balance_forecasts" from "anon";

revoke references on table "public"."bank_balance_forecasts" from "anon";

revoke select on table "public"."bank_balance_forecasts" from "anon";

revoke trigger on table "public"."bank_balance_forecasts" from "anon";

revoke truncate on table "public"."bank_balance_forecasts" from "anon";

revoke update on table "public"."bank_balance_forecasts" from "anon";

revoke delete on table "public"."bank_balance_forecasts" from "authenticated";

revoke insert on table "public"."bank_balance_forecasts" from "authenticated";

revoke references on table "public"."bank_balance_forecasts" from "authenticated";

revoke select on table "public"."bank_balance_forecasts" from "authenticated";

revoke trigger on table "public"."bank_balance_forecasts" from "authenticated";

revoke truncate on table "public"."bank_balance_forecasts" from "authenticated";

revoke update on table "public"."bank_balance_forecasts" from "authenticated";

revoke delete on table "public"."bank_balance_forecasts" from "service_role";

revoke insert on table "public"."bank_balance_forecasts" from "service_role";

revoke references on table "public"."bank_balance_forecasts" from "service_role";

revoke select on table "public"."bank_balance_forecasts" from "service_role";

revoke trigger on table "public"."bank_balance_forecasts" from "service_role";

revoke truncate on table "public"."bank_balance_forecasts" from "service_role";

revoke update on table "public"."bank_balance_forecasts" from "service_role";

revoke delete on table "public"."bank_cash_flow_analysis" from "anon";

revoke insert on table "public"."bank_cash_flow_analysis" from "anon";

revoke references on table "public"."bank_cash_flow_analysis" from "anon";

revoke select on table "public"."bank_cash_flow_analysis" from "anon";

revoke trigger on table "public"."bank_cash_flow_analysis" from "anon";

revoke truncate on table "public"."bank_cash_flow_analysis" from "anon";

revoke update on table "public"."bank_cash_flow_analysis" from "anon";

revoke delete on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke insert on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke references on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke select on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke trigger on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke truncate on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke update on table "public"."bank_cash_flow_analysis" from "authenticated";

revoke delete on table "public"."bank_cash_flow_analysis" from "service_role";

revoke insert on table "public"."bank_cash_flow_analysis" from "service_role";

revoke references on table "public"."bank_cash_flow_analysis" from "service_role";

revoke select on table "public"."bank_cash_flow_analysis" from "service_role";

revoke trigger on table "public"."bank_cash_flow_analysis" from "service_role";

revoke truncate on table "public"."bank_cash_flow_analysis" from "service_role";

revoke update on table "public"."bank_cash_flow_analysis" from "service_role";

revoke delete on table "public"."bank_categorization_rules" from "anon";

revoke insert on table "public"."bank_categorization_rules" from "anon";

revoke references on table "public"."bank_categorization_rules" from "anon";

revoke select on table "public"."bank_categorization_rules" from "anon";

revoke trigger on table "public"."bank_categorization_rules" from "anon";

revoke truncate on table "public"."bank_categorization_rules" from "anon";

revoke update on table "public"."bank_categorization_rules" from "anon";

revoke delete on table "public"."bank_categorization_rules" from "authenticated";

revoke insert on table "public"."bank_categorization_rules" from "authenticated";

revoke references on table "public"."bank_categorization_rules" from "authenticated";

revoke select on table "public"."bank_categorization_rules" from "authenticated";

revoke trigger on table "public"."bank_categorization_rules" from "authenticated";

revoke truncate on table "public"."bank_categorization_rules" from "authenticated";

revoke update on table "public"."bank_categorization_rules" from "authenticated";

revoke delete on table "public"."bank_categorization_rules" from "service_role";

revoke insert on table "public"."bank_categorization_rules" from "service_role";

revoke references on table "public"."bank_categorization_rules" from "service_role";

revoke select on table "public"."bank_categorization_rules" from "service_role";

revoke trigger on table "public"."bank_categorization_rules" from "service_role";

revoke truncate on table "public"."bank_categorization_rules" from "service_role";

revoke update on table "public"."bank_categorization_rules" from "service_role";

revoke delete on table "public"."bank_connections" from "anon";

revoke insert on table "public"."bank_connections" from "anon";

revoke references on table "public"."bank_connections" from "anon";

revoke select on table "public"."bank_connections" from "anon";

revoke trigger on table "public"."bank_connections" from "anon";

revoke truncate on table "public"."bank_connections" from "anon";

revoke update on table "public"."bank_connections" from "anon";

revoke delete on table "public"."bank_connections" from "authenticated";

revoke insert on table "public"."bank_connections" from "authenticated";

revoke references on table "public"."bank_connections" from "authenticated";

revoke select on table "public"."bank_connections" from "authenticated";

revoke trigger on table "public"."bank_connections" from "authenticated";

revoke truncate on table "public"."bank_connections" from "authenticated";

revoke update on table "public"."bank_connections" from "authenticated";

revoke delete on table "public"."bank_connections" from "service_role";

revoke insert on table "public"."bank_connections" from "service_role";

revoke references on table "public"."bank_connections" from "service_role";

revoke select on table "public"."bank_connections" from "service_role";

revoke trigger on table "public"."bank_connections" from "service_role";

revoke truncate on table "public"."bank_connections" from "service_role";

revoke update on table "public"."bank_connections" from "service_role";

revoke delete on table "public"."bank_consents" from "anon";

revoke insert on table "public"."bank_consents" from "anon";

revoke references on table "public"."bank_consents" from "anon";

revoke select on table "public"."bank_consents" from "anon";

revoke trigger on table "public"."bank_consents" from "anon";

revoke truncate on table "public"."bank_consents" from "anon";

revoke update on table "public"."bank_consents" from "anon";

revoke delete on table "public"."bank_consents" from "authenticated";

revoke insert on table "public"."bank_consents" from "authenticated";

revoke references on table "public"."bank_consents" from "authenticated";

revoke select on table "public"."bank_consents" from "authenticated";

revoke trigger on table "public"."bank_consents" from "authenticated";

revoke truncate on table "public"."bank_consents" from "authenticated";

revoke update on table "public"."bank_consents" from "authenticated";

revoke delete on table "public"."bank_consents" from "service_role";

revoke insert on table "public"."bank_consents" from "service_role";

revoke references on table "public"."bank_consents" from "service_role";

revoke select on table "public"."bank_consents" from "service_role";

revoke trigger on table "public"."bank_consents" from "service_role";

revoke truncate on table "public"."bank_consents" from "service_role";

revoke update on table "public"."bank_consents" from "service_role";

revoke delete on table "public"."bank_dashboards" from "anon";

revoke insert on table "public"."bank_dashboards" from "anon";

revoke references on table "public"."bank_dashboards" from "anon";

revoke select on table "public"."bank_dashboards" from "anon";

revoke trigger on table "public"."bank_dashboards" from "anon";

revoke truncate on table "public"."bank_dashboards" from "anon";

revoke update on table "public"."bank_dashboards" from "anon";

revoke delete on table "public"."bank_dashboards" from "authenticated";

revoke insert on table "public"."bank_dashboards" from "authenticated";

revoke references on table "public"."bank_dashboards" from "authenticated";

revoke select on table "public"."bank_dashboards" from "authenticated";

revoke trigger on table "public"."bank_dashboards" from "authenticated";

revoke truncate on table "public"."bank_dashboards" from "authenticated";

revoke update on table "public"."bank_dashboards" from "authenticated";

revoke delete on table "public"."bank_dashboards" from "service_role";

revoke insert on table "public"."bank_dashboards" from "service_role";

revoke references on table "public"."bank_dashboards" from "service_role";

revoke select on table "public"."bank_dashboards" from "service_role";

revoke trigger on table "public"."bank_dashboards" from "service_role";

revoke truncate on table "public"."bank_dashboards" from "service_role";

revoke update on table "public"."bank_dashboards" from "service_role";

revoke delete on table "public"."bank_encrypted_credentials" from "anon";

revoke insert on table "public"."bank_encrypted_credentials" from "anon";

revoke references on table "public"."bank_encrypted_credentials" from "anon";

revoke select on table "public"."bank_encrypted_credentials" from "anon";

revoke trigger on table "public"."bank_encrypted_credentials" from "anon";

revoke truncate on table "public"."bank_encrypted_credentials" from "anon";

revoke update on table "public"."bank_encrypted_credentials" from "anon";

revoke delete on table "public"."bank_encrypted_credentials" from "authenticated";

revoke insert on table "public"."bank_encrypted_credentials" from "authenticated";

revoke references on table "public"."bank_encrypted_credentials" from "authenticated";

revoke select on table "public"."bank_encrypted_credentials" from "authenticated";

revoke trigger on table "public"."bank_encrypted_credentials" from "authenticated";

revoke truncate on table "public"."bank_encrypted_credentials" from "authenticated";

revoke update on table "public"."bank_encrypted_credentials" from "authenticated";

revoke delete on table "public"."bank_encrypted_credentials" from "service_role";

revoke insert on table "public"."bank_encrypted_credentials" from "service_role";

revoke references on table "public"."bank_encrypted_credentials" from "service_role";

revoke select on table "public"."bank_encrypted_credentials" from "service_role";

revoke trigger on table "public"."bank_encrypted_credentials" from "service_role";

revoke truncate on table "public"."bank_encrypted_credentials" from "service_role";

revoke update on table "public"."bank_encrypted_credentials" from "service_role";

revoke delete on table "public"."bank_export_formats" from "anon";

revoke insert on table "public"."bank_export_formats" from "anon";

revoke references on table "public"."bank_export_formats" from "anon";

revoke select on table "public"."bank_export_formats" from "anon";

revoke trigger on table "public"."bank_export_formats" from "anon";

revoke truncate on table "public"."bank_export_formats" from "anon";

revoke update on table "public"."bank_export_formats" from "anon";

revoke delete on table "public"."bank_export_formats" from "authenticated";

revoke insert on table "public"."bank_export_formats" from "authenticated";

revoke references on table "public"."bank_export_formats" from "authenticated";

revoke select on table "public"."bank_export_formats" from "authenticated";

revoke trigger on table "public"."bank_export_formats" from "authenticated";

revoke truncate on table "public"."bank_export_formats" from "authenticated";

revoke update on table "public"."bank_export_formats" from "authenticated";

revoke delete on table "public"."bank_export_formats" from "service_role";

revoke insert on table "public"."bank_export_formats" from "service_role";

revoke references on table "public"."bank_export_formats" from "service_role";

revoke select on table "public"."bank_export_formats" from "service_role";

revoke trigger on table "public"."bank_export_formats" from "service_role";

revoke truncate on table "public"."bank_export_formats" from "service_role";

revoke update on table "public"."bank_export_formats" from "service_role";

revoke delete on table "public"."bank_export_jobs" from "anon";

revoke insert on table "public"."bank_export_jobs" from "anon";

revoke references on table "public"."bank_export_jobs" from "anon";

revoke select on table "public"."bank_export_jobs" from "anon";

revoke trigger on table "public"."bank_export_jobs" from "anon";

revoke truncate on table "public"."bank_export_jobs" from "anon";

revoke update on table "public"."bank_export_jobs" from "anon";

revoke delete on table "public"."bank_export_jobs" from "authenticated";

revoke insert on table "public"."bank_export_jobs" from "authenticated";

revoke references on table "public"."bank_export_jobs" from "authenticated";

revoke select on table "public"."bank_export_jobs" from "authenticated";

revoke trigger on table "public"."bank_export_jobs" from "authenticated";

revoke truncate on table "public"."bank_export_jobs" from "authenticated";

revoke update on table "public"."bank_export_jobs" from "authenticated";

revoke delete on table "public"."bank_export_jobs" from "service_role";

revoke insert on table "public"."bank_export_jobs" from "service_role";

revoke references on table "public"."bank_export_jobs" from "service_role";

revoke select on table "public"."bank_export_jobs" from "service_role";

revoke trigger on table "public"."bank_export_jobs" from "service_role";

revoke truncate on table "public"."bank_export_jobs" from "service_role";

revoke update on table "public"."bank_export_jobs" from "service_role";

revoke delete on table "public"."bank_field_mappings" from "anon";

revoke insert on table "public"."bank_field_mappings" from "anon";

revoke references on table "public"."bank_field_mappings" from "anon";

revoke select on table "public"."bank_field_mappings" from "anon";

revoke trigger on table "public"."bank_field_mappings" from "anon";

revoke truncate on table "public"."bank_field_mappings" from "anon";

revoke update on table "public"."bank_field_mappings" from "anon";

revoke delete on table "public"."bank_field_mappings" from "authenticated";

revoke insert on table "public"."bank_field_mappings" from "authenticated";

revoke references on table "public"."bank_field_mappings" from "authenticated";

revoke select on table "public"."bank_field_mappings" from "authenticated";

revoke trigger on table "public"."bank_field_mappings" from "authenticated";

revoke truncate on table "public"."bank_field_mappings" from "authenticated";

revoke update on table "public"."bank_field_mappings" from "authenticated";

revoke delete on table "public"."bank_field_mappings" from "service_role";

revoke insert on table "public"."bank_field_mappings" from "service_role";

revoke references on table "public"."bank_field_mappings" from "service_role";

revoke select on table "public"."bank_field_mappings" from "service_role";

revoke trigger on table "public"."bank_field_mappings" from "service_role";

revoke truncate on table "public"."bank_field_mappings" from "service_role";

revoke update on table "public"."bank_field_mappings" from "service_role";

revoke delete on table "public"."bank_merchant_data" from "anon";

revoke insert on table "public"."bank_merchant_data" from "anon";

revoke references on table "public"."bank_merchant_data" from "anon";

revoke select on table "public"."bank_merchant_data" from "anon";

revoke trigger on table "public"."bank_merchant_data" from "anon";

revoke truncate on table "public"."bank_merchant_data" from "anon";

revoke update on table "public"."bank_merchant_data" from "anon";

revoke delete on table "public"."bank_merchant_data" from "authenticated";

revoke insert on table "public"."bank_merchant_data" from "authenticated";

revoke references on table "public"."bank_merchant_data" from "authenticated";

revoke select on table "public"."bank_merchant_data" from "authenticated";

revoke trigger on table "public"."bank_merchant_data" from "authenticated";

revoke truncate on table "public"."bank_merchant_data" from "authenticated";

revoke update on table "public"."bank_merchant_data" from "authenticated";

revoke delete on table "public"."bank_merchant_data" from "service_role";

revoke insert on table "public"."bank_merchant_data" from "service_role";

revoke references on table "public"."bank_merchant_data" from "service_role";

revoke select on table "public"."bank_merchant_data" from "service_role";

revoke trigger on table "public"."bank_merchant_data" from "service_role";

revoke truncate on table "public"."bank_merchant_data" from "service_role";

revoke update on table "public"."bank_merchant_data" from "service_role";

revoke delete on table "public"."bank_notifications" from "anon";

revoke insert on table "public"."bank_notifications" from "anon";

revoke references on table "public"."bank_notifications" from "anon";

revoke select on table "public"."bank_notifications" from "anon";

revoke trigger on table "public"."bank_notifications" from "anon";

revoke truncate on table "public"."bank_notifications" from "anon";

revoke update on table "public"."bank_notifications" from "anon";

revoke delete on table "public"."bank_notifications" from "authenticated";

revoke insert on table "public"."bank_notifications" from "authenticated";

revoke references on table "public"."bank_notifications" from "authenticated";

revoke select on table "public"."bank_notifications" from "authenticated";

revoke trigger on table "public"."bank_notifications" from "authenticated";

revoke truncate on table "public"."bank_notifications" from "authenticated";

revoke update on table "public"."bank_notifications" from "authenticated";

revoke delete on table "public"."bank_notifications" from "service_role";

revoke insert on table "public"."bank_notifications" from "service_role";

revoke references on table "public"."bank_notifications" from "service_role";

revoke select on table "public"."bank_notifications" from "service_role";

revoke trigger on table "public"."bank_notifications" from "service_role";

revoke truncate on table "public"."bank_notifications" from "service_role";

revoke update on table "public"."bank_notifications" from "service_role";

revoke delete on table "public"."bank_providers" from "anon";

revoke insert on table "public"."bank_providers" from "anon";

revoke references on table "public"."bank_providers" from "anon";

revoke select on table "public"."bank_providers" from "anon";

revoke trigger on table "public"."bank_providers" from "anon";

revoke truncate on table "public"."bank_providers" from "anon";

revoke update on table "public"."bank_providers" from "anon";

revoke delete on table "public"."bank_providers" from "authenticated";

revoke insert on table "public"."bank_providers" from "authenticated";

revoke references on table "public"."bank_providers" from "authenticated";

revoke select on table "public"."bank_providers" from "authenticated";

revoke trigger on table "public"."bank_providers" from "authenticated";

revoke truncate on table "public"."bank_providers" from "authenticated";

revoke update on table "public"."bank_providers" from "authenticated";

revoke delete on table "public"."bank_providers" from "service_role";

revoke insert on table "public"."bank_providers" from "service_role";

revoke references on table "public"."bank_providers" from "service_role";

revoke select on table "public"."bank_providers" from "service_role";

revoke trigger on table "public"."bank_providers" from "service_role";

revoke truncate on table "public"."bank_providers" from "service_role";

revoke update on table "public"."bank_providers" from "service_role";

revoke delete on table "public"."bank_reconciliation" from "anon";

revoke insert on table "public"."bank_reconciliation" from "anon";

revoke references on table "public"."bank_reconciliation" from "anon";

revoke select on table "public"."bank_reconciliation" from "anon";

revoke trigger on table "public"."bank_reconciliation" from "anon";

revoke truncate on table "public"."bank_reconciliation" from "anon";

revoke update on table "public"."bank_reconciliation" from "anon";

revoke delete on table "public"."bank_reconciliation" from "authenticated";

revoke insert on table "public"."bank_reconciliation" from "authenticated";

revoke references on table "public"."bank_reconciliation" from "authenticated";

revoke select on table "public"."bank_reconciliation" from "authenticated";

revoke trigger on table "public"."bank_reconciliation" from "authenticated";

revoke truncate on table "public"."bank_reconciliation" from "authenticated";

revoke update on table "public"."bank_reconciliation" from "authenticated";

revoke delete on table "public"."bank_reconciliation" from "service_role";

revoke insert on table "public"."bank_reconciliation" from "service_role";

revoke references on table "public"."bank_reconciliation" from "service_role";

revoke select on table "public"."bank_reconciliation" from "service_role";

revoke trigger on table "public"."bank_reconciliation" from "service_role";

revoke truncate on table "public"."bank_reconciliation" from "service_role";

revoke update on table "public"."bank_reconciliation" from "service_role";

revoke delete on table "public"."bank_reconciliation_log" from "anon";

revoke insert on table "public"."bank_reconciliation_log" from "anon";

revoke references on table "public"."bank_reconciliation_log" from "anon";

revoke select on table "public"."bank_reconciliation_log" from "anon";

revoke trigger on table "public"."bank_reconciliation_log" from "anon";

revoke truncate on table "public"."bank_reconciliation_log" from "anon";

revoke update on table "public"."bank_reconciliation_log" from "anon";

revoke delete on table "public"."bank_reconciliation_log" from "authenticated";

revoke insert on table "public"."bank_reconciliation_log" from "authenticated";

revoke references on table "public"."bank_reconciliation_log" from "authenticated";

revoke select on table "public"."bank_reconciliation_log" from "authenticated";

revoke trigger on table "public"."bank_reconciliation_log" from "authenticated";

revoke truncate on table "public"."bank_reconciliation_log" from "authenticated";

revoke update on table "public"."bank_reconciliation_log" from "authenticated";

revoke delete on table "public"."bank_reconciliation_log" from "service_role";

revoke insert on table "public"."bank_reconciliation_log" from "service_role";

revoke references on table "public"."bank_reconciliation_log" from "service_role";

revoke select on table "public"."bank_reconciliation_log" from "service_role";

revoke trigger on table "public"."bank_reconciliation_log" from "service_role";

revoke truncate on table "public"."bank_reconciliation_log" from "service_role";

revoke update on table "public"."bank_reconciliation_log" from "service_role";

revoke delete on table "public"."bank_reconciliation_matches" from "anon";

revoke insert on table "public"."bank_reconciliation_matches" from "anon";

revoke references on table "public"."bank_reconciliation_matches" from "anon";

revoke select on table "public"."bank_reconciliation_matches" from "anon";

revoke trigger on table "public"."bank_reconciliation_matches" from "anon";

revoke truncate on table "public"."bank_reconciliation_matches" from "anon";

revoke update on table "public"."bank_reconciliation_matches" from "anon";

revoke delete on table "public"."bank_reconciliation_matches" from "authenticated";

revoke insert on table "public"."bank_reconciliation_matches" from "authenticated";

revoke references on table "public"."bank_reconciliation_matches" from "authenticated";

revoke select on table "public"."bank_reconciliation_matches" from "authenticated";

revoke trigger on table "public"."bank_reconciliation_matches" from "authenticated";

revoke truncate on table "public"."bank_reconciliation_matches" from "authenticated";

revoke update on table "public"."bank_reconciliation_matches" from "authenticated";

revoke delete on table "public"."bank_reconciliation_matches" from "service_role";

revoke insert on table "public"."bank_reconciliation_matches" from "service_role";

revoke references on table "public"."bank_reconciliation_matches" from "service_role";

revoke select on table "public"."bank_reconciliation_matches" from "service_role";

revoke trigger on table "public"."bank_reconciliation_matches" from "service_role";

revoke truncate on table "public"."bank_reconciliation_matches" from "service_role";

revoke update on table "public"."bank_reconciliation_matches" from "service_role";

revoke delete on table "public"."bank_reconciliation_rules" from "anon";

revoke insert on table "public"."bank_reconciliation_rules" from "anon";

revoke references on table "public"."bank_reconciliation_rules" from "anon";

revoke select on table "public"."bank_reconciliation_rules" from "anon";

revoke trigger on table "public"."bank_reconciliation_rules" from "anon";

revoke truncate on table "public"."bank_reconciliation_rules" from "anon";

revoke update on table "public"."bank_reconciliation_rules" from "anon";

revoke delete on table "public"."bank_reconciliation_rules" from "authenticated";

revoke insert on table "public"."bank_reconciliation_rules" from "authenticated";

revoke references on table "public"."bank_reconciliation_rules" from "authenticated";

revoke select on table "public"."bank_reconciliation_rules" from "authenticated";

revoke trigger on table "public"."bank_reconciliation_rules" from "authenticated";

revoke truncate on table "public"."bank_reconciliation_rules" from "authenticated";

revoke update on table "public"."bank_reconciliation_rules" from "authenticated";

revoke delete on table "public"."bank_reconciliation_rules" from "service_role";

revoke insert on table "public"."bank_reconciliation_rules" from "service_role";

revoke references on table "public"."bank_reconciliation_rules" from "service_role";

revoke select on table "public"."bank_reconciliation_rules" from "service_role";

revoke trigger on table "public"."bank_reconciliation_rules" from "service_role";

revoke truncate on table "public"."bank_reconciliation_rules" from "service_role";

revoke update on table "public"."bank_reconciliation_rules" from "service_role";

revoke delete on table "public"."bank_sca_methods" from "anon";

revoke insert on table "public"."bank_sca_methods" from "anon";

revoke references on table "public"."bank_sca_methods" from "anon";

revoke select on table "public"."bank_sca_methods" from "anon";

revoke trigger on table "public"."bank_sca_methods" from "anon";

revoke truncate on table "public"."bank_sca_methods" from "anon";

revoke update on table "public"."bank_sca_methods" from "anon";

revoke delete on table "public"."bank_sca_methods" from "authenticated";

revoke insert on table "public"."bank_sca_methods" from "authenticated";

revoke references on table "public"."bank_sca_methods" from "authenticated";

revoke select on table "public"."bank_sca_methods" from "authenticated";

revoke trigger on table "public"."bank_sca_methods" from "authenticated";

revoke truncate on table "public"."bank_sca_methods" from "authenticated";

revoke update on table "public"."bank_sca_methods" from "authenticated";

revoke delete on table "public"."bank_sca_methods" from "service_role";

revoke insert on table "public"."bank_sca_methods" from "service_role";

revoke references on table "public"."bank_sca_methods" from "service_role";

revoke select on table "public"."bank_sca_methods" from "service_role";

revoke trigger on table "public"."bank_sca_methods" from "service_role";

revoke truncate on table "public"."bank_sca_methods" from "service_role";

revoke update on table "public"."bank_sca_methods" from "service_role";

revoke delete on table "public"."bank_spending_patterns" from "anon";

revoke insert on table "public"."bank_spending_patterns" from "anon";

revoke references on table "public"."bank_spending_patterns" from "anon";

revoke select on table "public"."bank_spending_patterns" from "anon";

revoke trigger on table "public"."bank_spending_patterns" from "anon";

revoke truncate on table "public"."bank_spending_patterns" from "anon";

revoke update on table "public"."bank_spending_patterns" from "anon";

revoke delete on table "public"."bank_spending_patterns" from "authenticated";

revoke insert on table "public"."bank_spending_patterns" from "authenticated";

revoke references on table "public"."bank_spending_patterns" from "authenticated";

revoke select on table "public"."bank_spending_patterns" from "authenticated";

revoke trigger on table "public"."bank_spending_patterns" from "authenticated";

revoke truncate on table "public"."bank_spending_patterns" from "authenticated";

revoke update on table "public"."bank_spending_patterns" from "authenticated";

revoke delete on table "public"."bank_spending_patterns" from "service_role";

revoke insert on table "public"."bank_spending_patterns" from "service_role";

revoke references on table "public"."bank_spending_patterns" from "service_role";

revoke select on table "public"."bank_spending_patterns" from "service_role";

revoke trigger on table "public"."bank_spending_patterns" from "service_role";

revoke truncate on table "public"."bank_spending_patterns" from "service_role";

revoke update on table "public"."bank_spending_patterns" from "service_role";

revoke delete on table "public"."bank_supported_banks" from "anon";

revoke insert on table "public"."bank_supported_banks" from "anon";

revoke references on table "public"."bank_supported_banks" from "anon";

revoke select on table "public"."bank_supported_banks" from "anon";

revoke trigger on table "public"."bank_supported_banks" from "anon";

revoke truncate on table "public"."bank_supported_banks" from "anon";

revoke update on table "public"."bank_supported_banks" from "anon";

revoke delete on table "public"."bank_supported_banks" from "authenticated";

revoke insert on table "public"."bank_supported_banks" from "authenticated";

revoke references on table "public"."bank_supported_banks" from "authenticated";

revoke select on table "public"."bank_supported_banks" from "authenticated";

revoke trigger on table "public"."bank_supported_banks" from "authenticated";

revoke truncate on table "public"."bank_supported_banks" from "authenticated";

revoke update on table "public"."bank_supported_banks" from "authenticated";

revoke delete on table "public"."bank_supported_banks" from "service_role";

revoke insert on table "public"."bank_supported_banks" from "service_role";

revoke references on table "public"."bank_supported_banks" from "service_role";

revoke select on table "public"."bank_supported_banks" from "service_role";

revoke trigger on table "public"."bank_supported_banks" from "service_role";

revoke truncate on table "public"."bank_supported_banks" from "service_role";

revoke update on table "public"."bank_supported_banks" from "service_role";

revoke delete on table "public"."bank_sync_statistics" from "anon";

revoke insert on table "public"."bank_sync_statistics" from "anon";

revoke references on table "public"."bank_sync_statistics" from "anon";

revoke select on table "public"."bank_sync_statistics" from "anon";

revoke trigger on table "public"."bank_sync_statistics" from "anon";

revoke truncate on table "public"."bank_sync_statistics" from "anon";

revoke update on table "public"."bank_sync_statistics" from "anon";

revoke delete on table "public"."bank_sync_statistics" from "authenticated";

revoke insert on table "public"."bank_sync_statistics" from "authenticated";

revoke references on table "public"."bank_sync_statistics" from "authenticated";

revoke select on table "public"."bank_sync_statistics" from "authenticated";

revoke trigger on table "public"."bank_sync_statistics" from "authenticated";

revoke truncate on table "public"."bank_sync_statistics" from "authenticated";

revoke update on table "public"."bank_sync_statistics" from "authenticated";

revoke delete on table "public"."bank_sync_statistics" from "service_role";

revoke insert on table "public"."bank_sync_statistics" from "service_role";

revoke references on table "public"."bank_sync_statistics" from "service_role";

revoke select on table "public"."bank_sync_statistics" from "service_role";

revoke trigger on table "public"."bank_sync_statistics" from "service_role";

revoke truncate on table "public"."bank_sync_statistics" from "service_role";

revoke update on table "public"."bank_sync_statistics" from "service_role";

revoke delete on table "public"."bank_token_rotation_log" from "anon";

revoke insert on table "public"."bank_token_rotation_log" from "anon";

revoke references on table "public"."bank_token_rotation_log" from "anon";

revoke select on table "public"."bank_token_rotation_log" from "anon";

revoke trigger on table "public"."bank_token_rotation_log" from "anon";

revoke truncate on table "public"."bank_token_rotation_log" from "anon";

revoke update on table "public"."bank_token_rotation_log" from "anon";

revoke delete on table "public"."bank_token_rotation_log" from "authenticated";

revoke insert on table "public"."bank_token_rotation_log" from "authenticated";

revoke references on table "public"."bank_token_rotation_log" from "authenticated";

revoke select on table "public"."bank_token_rotation_log" from "authenticated";

revoke trigger on table "public"."bank_token_rotation_log" from "authenticated";

revoke truncate on table "public"."bank_token_rotation_log" from "authenticated";

revoke update on table "public"."bank_token_rotation_log" from "authenticated";

revoke delete on table "public"."bank_token_rotation_log" from "service_role";

revoke insert on table "public"."bank_token_rotation_log" from "service_role";

revoke references on table "public"."bank_token_rotation_log" from "service_role";

revoke select on table "public"."bank_token_rotation_log" from "service_role";

revoke trigger on table "public"."bank_token_rotation_log" from "service_role";

revoke truncate on table "public"."bank_token_rotation_log" from "service_role";

revoke update on table "public"."bank_token_rotation_log" from "service_role";

revoke delete on table "public"."bank_transaction_categories" from "anon";

revoke insert on table "public"."bank_transaction_categories" from "anon";

revoke references on table "public"."bank_transaction_categories" from "anon";

revoke select on table "public"."bank_transaction_categories" from "anon";

revoke trigger on table "public"."bank_transaction_categories" from "anon";

revoke truncate on table "public"."bank_transaction_categories" from "anon";

revoke update on table "public"."bank_transaction_categories" from "anon";

revoke delete on table "public"."bank_transaction_categories" from "authenticated";

revoke insert on table "public"."bank_transaction_categories" from "authenticated";

revoke references on table "public"."bank_transaction_categories" from "authenticated";

revoke select on table "public"."bank_transaction_categories" from "authenticated";

revoke trigger on table "public"."bank_transaction_categories" from "authenticated";

revoke truncate on table "public"."bank_transaction_categories" from "authenticated";

revoke update on table "public"."bank_transaction_categories" from "authenticated";

revoke delete on table "public"."bank_transaction_categories" from "service_role";

revoke insert on table "public"."bank_transaction_categories" from "service_role";

revoke references on table "public"."bank_transaction_categories" from "service_role";

revoke select on table "public"."bank_transaction_categories" from "service_role";

revoke trigger on table "public"."bank_transaction_categories" from "service_role";

revoke truncate on table "public"."bank_transaction_categories" from "service_role";

revoke update on table "public"."bank_transaction_categories" from "service_role";

revoke delete on table "public"."bank_transactions" from "anon";

revoke insert on table "public"."bank_transactions" from "anon";

revoke references on table "public"."bank_transactions" from "anon";

revoke select on table "public"."bank_transactions" from "anon";

revoke trigger on table "public"."bank_transactions" from "anon";

revoke truncate on table "public"."bank_transactions" from "anon";

revoke update on table "public"."bank_transactions" from "anon";

revoke delete on table "public"."bank_transactions" from "authenticated";

revoke insert on table "public"."bank_transactions" from "authenticated";

revoke references on table "public"."bank_transactions" from "authenticated";

revoke select on table "public"."bank_transactions" from "authenticated";

revoke trigger on table "public"."bank_transactions" from "authenticated";

revoke truncate on table "public"."bank_transactions" from "authenticated";

revoke update on table "public"."bank_transactions" from "authenticated";

revoke delete on table "public"."bank_transactions" from "service_role";

revoke insert on table "public"."bank_transactions" from "service_role";

revoke references on table "public"."bank_transactions" from "service_role";

revoke select on table "public"."bank_transactions" from "service_role";

revoke trigger on table "public"."bank_transactions" from "service_role";

revoke truncate on table "public"."bank_transactions" from "service_role";

revoke update on table "public"."bank_transactions" from "service_role";

revoke delete on table "public"."bank_validation_rules" from "anon";

revoke insert on table "public"."bank_validation_rules" from "anon";

revoke references on table "public"."bank_validation_rules" from "anon";

revoke select on table "public"."bank_validation_rules" from "anon";

revoke trigger on table "public"."bank_validation_rules" from "anon";

revoke truncate on table "public"."bank_validation_rules" from "anon";

revoke update on table "public"."bank_validation_rules" from "anon";

revoke delete on table "public"."bank_validation_rules" from "authenticated";

revoke insert on table "public"."bank_validation_rules" from "authenticated";

revoke references on table "public"."bank_validation_rules" from "authenticated";

revoke select on table "public"."bank_validation_rules" from "authenticated";

revoke trigger on table "public"."bank_validation_rules" from "authenticated";

revoke truncate on table "public"."bank_validation_rules" from "authenticated";

revoke update on table "public"."bank_validation_rules" from "authenticated";

revoke delete on table "public"."bank_validation_rules" from "service_role";

revoke insert on table "public"."bank_validation_rules" from "service_role";

revoke references on table "public"."bank_validation_rules" from "service_role";

revoke select on table "public"."bank_validation_rules" from "service_role";

revoke trigger on table "public"."bank_validation_rules" from "service_role";

revoke truncate on table "public"."bank_validation_rules" from "service_role";

revoke update on table "public"."bank_validation_rules" from "service_role";

revoke delete on table "public"."bank_webhook_configs" from "anon";

revoke insert on table "public"."bank_webhook_configs" from "anon";

revoke references on table "public"."bank_webhook_configs" from "anon";

revoke select on table "public"."bank_webhook_configs" from "anon";

revoke trigger on table "public"."bank_webhook_configs" from "anon";

revoke truncate on table "public"."bank_webhook_configs" from "anon";

revoke update on table "public"."bank_webhook_configs" from "anon";

revoke delete on table "public"."bank_webhook_configs" from "authenticated";

revoke insert on table "public"."bank_webhook_configs" from "authenticated";

revoke references on table "public"."bank_webhook_configs" from "authenticated";

revoke select on table "public"."bank_webhook_configs" from "authenticated";

revoke trigger on table "public"."bank_webhook_configs" from "authenticated";

revoke truncate on table "public"."bank_webhook_configs" from "authenticated";

revoke update on table "public"."bank_webhook_configs" from "authenticated";

revoke delete on table "public"."bank_webhook_configs" from "service_role";

revoke insert on table "public"."bank_webhook_configs" from "service_role";

revoke references on table "public"."bank_webhook_configs" from "service_role";

revoke select on table "public"."bank_webhook_configs" from "service_role";

revoke trigger on table "public"."bank_webhook_configs" from "service_role";

revoke truncate on table "public"."bank_webhook_configs" from "service_role";

revoke update on table "public"."bank_webhook_configs" from "service_role";

revoke delete on table "public"."bank_webhook_events" from "anon";

revoke insert on table "public"."bank_webhook_events" from "anon";

revoke references on table "public"."bank_webhook_events" from "anon";

revoke select on table "public"."bank_webhook_events" from "anon";

revoke trigger on table "public"."bank_webhook_events" from "anon";

revoke truncate on table "public"."bank_webhook_events" from "anon";

revoke update on table "public"."bank_webhook_events" from "anon";

revoke delete on table "public"."bank_webhook_events" from "authenticated";

revoke insert on table "public"."bank_webhook_events" from "authenticated";

revoke references on table "public"."bank_webhook_events" from "authenticated";

revoke select on table "public"."bank_webhook_events" from "authenticated";

revoke trigger on table "public"."bank_webhook_events" from "authenticated";

revoke truncate on table "public"."bank_webhook_events" from "authenticated";

revoke update on table "public"."bank_webhook_events" from "authenticated";

revoke delete on table "public"."bank_webhook_events" from "service_role";

revoke insert on table "public"."bank_webhook_events" from "service_role";

revoke references on table "public"."bank_webhook_events" from "service_role";

revoke select on table "public"."bank_webhook_events" from "service_role";

revoke trigger on table "public"."bank_webhook_events" from "service_role";

revoke truncate on table "public"."bank_webhook_events" from "service_role";

revoke update on table "public"."bank_webhook_events" from "service_role";

revoke delete on table "public"."benefits" from "anon";

revoke insert on table "public"."benefits" from "anon";

revoke references on table "public"."benefits" from "anon";

revoke select on table "public"."benefits" from "anon";

revoke trigger on table "public"."benefits" from "anon";

revoke truncate on table "public"."benefits" from "anon";

revoke update on table "public"."benefits" from "anon";

revoke delete on table "public"."benefits" from "authenticated";

revoke insert on table "public"."benefits" from "authenticated";

revoke references on table "public"."benefits" from "authenticated";

revoke select on table "public"."benefits" from "authenticated";

revoke trigger on table "public"."benefits" from "authenticated";

revoke truncate on table "public"."benefits" from "authenticated";

revoke update on table "public"."benefits" from "authenticated";

revoke delete on table "public"."benefits" from "service_role";

revoke insert on table "public"."benefits" from "service_role";

revoke references on table "public"."benefits" from "service_role";

revoke select on table "public"."benefits" from "service_role";

revoke trigger on table "public"."benefits" from "service_role";

revoke truncate on table "public"."benefits" from "service_role";

revoke update on table "public"."benefits" from "service_role";

revoke delete on table "public"."budget_approvals" from "anon";

revoke insert on table "public"."budget_approvals" from "anon";

revoke references on table "public"."budget_approvals" from "anon";

revoke select on table "public"."budget_approvals" from "anon";

revoke trigger on table "public"."budget_approvals" from "anon";

revoke truncate on table "public"."budget_approvals" from "anon";

revoke update on table "public"."budget_approvals" from "anon";

revoke delete on table "public"."budget_approvals" from "authenticated";

revoke insert on table "public"."budget_approvals" from "authenticated";

revoke references on table "public"."budget_approvals" from "authenticated";

revoke select on table "public"."budget_approvals" from "authenticated";

revoke trigger on table "public"."budget_approvals" from "authenticated";

revoke truncate on table "public"."budget_approvals" from "authenticated";

revoke update on table "public"."budget_approvals" from "authenticated";

revoke delete on table "public"."budget_approvals" from "service_role";

revoke insert on table "public"."budget_approvals" from "service_role";

revoke references on table "public"."budget_approvals" from "service_role";

revoke select on table "public"."budget_approvals" from "service_role";

revoke trigger on table "public"."budget_approvals" from "service_role";

revoke truncate on table "public"."budget_approvals" from "service_role";

revoke update on table "public"."budget_approvals" from "service_role";

revoke delete on table "public"."budget_assumptions" from "anon";

revoke insert on table "public"."budget_assumptions" from "anon";

revoke references on table "public"."budget_assumptions" from "anon";

revoke select on table "public"."budget_assumptions" from "anon";

revoke trigger on table "public"."budget_assumptions" from "anon";

revoke truncate on table "public"."budget_assumptions" from "anon";

revoke update on table "public"."budget_assumptions" from "anon";

revoke delete on table "public"."budget_assumptions" from "authenticated";

revoke insert on table "public"."budget_assumptions" from "authenticated";

revoke references on table "public"."budget_assumptions" from "authenticated";

revoke select on table "public"."budget_assumptions" from "authenticated";

revoke trigger on table "public"."budget_assumptions" from "authenticated";

revoke truncate on table "public"."budget_assumptions" from "authenticated";

revoke update on table "public"."budget_assumptions" from "authenticated";

revoke delete on table "public"."budget_assumptions" from "service_role";

revoke insert on table "public"."budget_assumptions" from "service_role";

revoke references on table "public"."budget_assumptions" from "service_role";

revoke select on table "public"."budget_assumptions" from "service_role";

revoke trigger on table "public"."budget_assumptions" from "service_role";

revoke truncate on table "public"."budget_assumptions" from "service_role";

revoke update on table "public"."budget_assumptions" from "service_role";

revoke delete on table "public"."budget_attachments" from "anon";

revoke insert on table "public"."budget_attachments" from "anon";

revoke references on table "public"."budget_attachments" from "anon";

revoke select on table "public"."budget_attachments" from "anon";

revoke trigger on table "public"."budget_attachments" from "anon";

revoke truncate on table "public"."budget_attachments" from "anon";

revoke update on table "public"."budget_attachments" from "anon";

revoke delete on table "public"."budget_attachments" from "authenticated";

revoke insert on table "public"."budget_attachments" from "authenticated";

revoke references on table "public"."budget_attachments" from "authenticated";

revoke select on table "public"."budget_attachments" from "authenticated";

revoke trigger on table "public"."budget_attachments" from "authenticated";

revoke truncate on table "public"."budget_attachments" from "authenticated";

revoke update on table "public"."budget_attachments" from "authenticated";

revoke delete on table "public"."budget_attachments" from "service_role";

revoke insert on table "public"."budget_attachments" from "service_role";

revoke references on table "public"."budget_attachments" from "service_role";

revoke select on table "public"."budget_attachments" from "service_role";

revoke trigger on table "public"."budget_attachments" from "service_role";

revoke truncate on table "public"."budget_attachments" from "service_role";

revoke update on table "public"."budget_attachments" from "service_role";

revoke delete on table "public"."budget_categories" from "anon";

revoke insert on table "public"."budget_categories" from "anon";

revoke references on table "public"."budget_categories" from "anon";

revoke select on table "public"."budget_categories" from "anon";

revoke trigger on table "public"."budget_categories" from "anon";

revoke truncate on table "public"."budget_categories" from "anon";

revoke update on table "public"."budget_categories" from "anon";

revoke delete on table "public"."budget_categories" from "authenticated";

revoke insert on table "public"."budget_categories" from "authenticated";

revoke references on table "public"."budget_categories" from "authenticated";

revoke select on table "public"."budget_categories" from "authenticated";

revoke trigger on table "public"."budget_categories" from "authenticated";

revoke truncate on table "public"."budget_categories" from "authenticated";

revoke update on table "public"."budget_categories" from "authenticated";

revoke delete on table "public"."budget_categories" from "service_role";

revoke insert on table "public"."budget_categories" from "service_role";

revoke references on table "public"."budget_categories" from "service_role";

revoke select on table "public"."budget_categories" from "service_role";

revoke trigger on table "public"."budget_categories" from "service_role";

revoke truncate on table "public"."budget_categories" from "service_role";

revoke update on table "public"."budget_categories" from "service_role";

revoke delete on table "public"."budget_category_templates" from "anon";

revoke insert on table "public"."budget_category_templates" from "anon";

revoke references on table "public"."budget_category_templates" from "anon";

revoke select on table "public"."budget_category_templates" from "anon";

revoke trigger on table "public"."budget_category_templates" from "anon";

revoke truncate on table "public"."budget_category_templates" from "anon";

revoke update on table "public"."budget_category_templates" from "anon";

revoke delete on table "public"."budget_category_templates" from "authenticated";

revoke insert on table "public"."budget_category_templates" from "authenticated";

revoke references on table "public"."budget_category_templates" from "authenticated";

revoke select on table "public"."budget_category_templates" from "authenticated";

revoke trigger on table "public"."budget_category_templates" from "authenticated";

revoke truncate on table "public"."budget_category_templates" from "authenticated";

revoke update on table "public"."budget_category_templates" from "authenticated";

revoke delete on table "public"."budget_category_templates" from "service_role";

revoke insert on table "public"."budget_category_templates" from "service_role";

revoke references on table "public"."budget_category_templates" from "service_role";

revoke select on table "public"."budget_category_templates" from "service_role";

revoke trigger on table "public"."budget_category_templates" from "service_role";

revoke truncate on table "public"."budget_category_templates" from "service_role";

revoke update on table "public"."budget_category_templates" from "service_role";

revoke delete on table "public"."budget_comments" from "anon";

revoke insert on table "public"."budget_comments" from "anon";

revoke references on table "public"."budget_comments" from "anon";

revoke select on table "public"."budget_comments" from "anon";

revoke trigger on table "public"."budget_comments" from "anon";

revoke truncate on table "public"."budget_comments" from "anon";

revoke update on table "public"."budget_comments" from "anon";

revoke delete on table "public"."budget_comments" from "authenticated";

revoke insert on table "public"."budget_comments" from "authenticated";

revoke references on table "public"."budget_comments" from "authenticated";

revoke select on table "public"."budget_comments" from "authenticated";

revoke trigger on table "public"."budget_comments" from "authenticated";

revoke truncate on table "public"."budget_comments" from "authenticated";

revoke update on table "public"."budget_comments" from "authenticated";

revoke delete on table "public"."budget_comments" from "service_role";

revoke insert on table "public"."budget_comments" from "service_role";

revoke references on table "public"."budget_comments" from "service_role";

revoke select on table "public"."budget_comments" from "service_role";

revoke trigger on table "public"."budget_comments" from "service_role";

revoke truncate on table "public"."budget_comments" from "service_role";

revoke update on table "public"."budget_comments" from "service_role";

revoke delete on table "public"."budget_forecasts" from "anon";

revoke insert on table "public"."budget_forecasts" from "anon";

revoke references on table "public"."budget_forecasts" from "anon";

revoke select on table "public"."budget_forecasts" from "anon";

revoke trigger on table "public"."budget_forecasts" from "anon";

revoke truncate on table "public"."budget_forecasts" from "anon";

revoke update on table "public"."budget_forecasts" from "anon";

revoke delete on table "public"."budget_forecasts" from "authenticated";

revoke insert on table "public"."budget_forecasts" from "authenticated";

revoke references on table "public"."budget_forecasts" from "authenticated";

revoke select on table "public"."budget_forecasts" from "authenticated";

revoke trigger on table "public"."budget_forecasts" from "authenticated";

revoke truncate on table "public"."budget_forecasts" from "authenticated";

revoke update on table "public"."budget_forecasts" from "authenticated";

revoke delete on table "public"."budget_forecasts" from "service_role";

revoke insert on table "public"."budget_forecasts" from "service_role";

revoke references on table "public"."budget_forecasts" from "service_role";

revoke select on table "public"."budget_forecasts" from "service_role";

revoke trigger on table "public"."budget_forecasts" from "service_role";

revoke truncate on table "public"."budget_forecasts" from "service_role";

revoke update on table "public"."budget_forecasts" from "service_role";

revoke delete on table "public"."budget_lines" from "anon";

revoke insert on table "public"."budget_lines" from "anon";

revoke references on table "public"."budget_lines" from "anon";

revoke select on table "public"."budget_lines" from "anon";

revoke trigger on table "public"."budget_lines" from "anon";

revoke truncate on table "public"."budget_lines" from "anon";

revoke update on table "public"."budget_lines" from "anon";

revoke delete on table "public"."budget_lines" from "authenticated";

revoke insert on table "public"."budget_lines" from "authenticated";

revoke references on table "public"."budget_lines" from "authenticated";

revoke select on table "public"."budget_lines" from "authenticated";

revoke trigger on table "public"."budget_lines" from "authenticated";

revoke truncate on table "public"."budget_lines" from "authenticated";

revoke update on table "public"."budget_lines" from "authenticated";

revoke delete on table "public"."budget_lines" from "service_role";

revoke insert on table "public"."budget_lines" from "service_role";

revoke references on table "public"."budget_lines" from "service_role";

revoke select on table "public"."budget_lines" from "service_role";

revoke trigger on table "public"."budget_lines" from "service_role";

revoke truncate on table "public"."budget_lines" from "service_role";

revoke update on table "public"."budget_lines" from "service_role";

revoke delete on table "public"."budget_notifications" from "anon";

revoke insert on table "public"."budget_notifications" from "anon";

revoke references on table "public"."budget_notifications" from "anon";

revoke select on table "public"."budget_notifications" from "anon";

revoke trigger on table "public"."budget_notifications" from "anon";

revoke truncate on table "public"."budget_notifications" from "anon";

revoke update on table "public"."budget_notifications" from "anon";

revoke delete on table "public"."budget_notifications" from "authenticated";

revoke insert on table "public"."budget_notifications" from "authenticated";

revoke references on table "public"."budget_notifications" from "authenticated";

revoke select on table "public"."budget_notifications" from "authenticated";

revoke trigger on table "public"."budget_notifications" from "authenticated";

revoke truncate on table "public"."budget_notifications" from "authenticated";

revoke update on table "public"."budget_notifications" from "authenticated";

revoke delete on table "public"."budget_notifications" from "service_role";

revoke insert on table "public"."budget_notifications" from "service_role";

revoke references on table "public"."budget_notifications" from "service_role";

revoke select on table "public"."budget_notifications" from "service_role";

revoke trigger on table "public"."budget_notifications" from "service_role";

revoke truncate on table "public"."budget_notifications" from "service_role";

revoke update on table "public"."budget_notifications" from "service_role";

revoke delete on table "public"."budget_scenarios" from "anon";

revoke insert on table "public"."budget_scenarios" from "anon";

revoke references on table "public"."budget_scenarios" from "anon";

revoke select on table "public"."budget_scenarios" from "anon";

revoke trigger on table "public"."budget_scenarios" from "anon";

revoke truncate on table "public"."budget_scenarios" from "anon";

revoke update on table "public"."budget_scenarios" from "anon";

revoke delete on table "public"."budget_scenarios" from "authenticated";

revoke insert on table "public"."budget_scenarios" from "authenticated";

revoke references on table "public"."budget_scenarios" from "authenticated";

revoke select on table "public"."budget_scenarios" from "authenticated";

revoke trigger on table "public"."budget_scenarios" from "authenticated";

revoke truncate on table "public"."budget_scenarios" from "authenticated";

revoke update on table "public"."budget_scenarios" from "authenticated";

revoke delete on table "public"."budget_scenarios" from "service_role";

revoke insert on table "public"."budget_scenarios" from "service_role";

revoke references on table "public"."budget_scenarios" from "service_role";

revoke select on table "public"."budget_scenarios" from "service_role";

revoke trigger on table "public"."budget_scenarios" from "service_role";

revoke truncate on table "public"."budget_scenarios" from "service_role";

revoke update on table "public"."budget_scenarios" from "service_role";

revoke delete on table "public"."budget_templates" from "anon";

revoke insert on table "public"."budget_templates" from "anon";

revoke references on table "public"."budget_templates" from "anon";

revoke select on table "public"."budget_templates" from "anon";

revoke trigger on table "public"."budget_templates" from "anon";

revoke truncate on table "public"."budget_templates" from "anon";

revoke update on table "public"."budget_templates" from "anon";

revoke delete on table "public"."budget_templates" from "authenticated";

revoke insert on table "public"."budget_templates" from "authenticated";

revoke references on table "public"."budget_templates" from "authenticated";

revoke select on table "public"."budget_templates" from "authenticated";

revoke trigger on table "public"."budget_templates" from "authenticated";

revoke truncate on table "public"."budget_templates" from "authenticated";

revoke update on table "public"."budget_templates" from "authenticated";

revoke delete on table "public"."budget_templates" from "service_role";

revoke insert on table "public"."budget_templates" from "service_role";

revoke references on table "public"."budget_templates" from "service_role";

revoke select on table "public"."budget_templates" from "service_role";

revoke trigger on table "public"."budget_templates" from "service_role";

revoke truncate on table "public"."budget_templates" from "service_role";

revoke update on table "public"."budget_templates" from "service_role";

revoke delete on table "public"."budget_variance_analysis" from "anon";

revoke insert on table "public"."budget_variance_analysis" from "anon";

revoke references on table "public"."budget_variance_analysis" from "anon";

revoke select on table "public"."budget_variance_analysis" from "anon";

revoke trigger on table "public"."budget_variance_analysis" from "anon";

revoke truncate on table "public"."budget_variance_analysis" from "anon";

revoke update on table "public"."budget_variance_analysis" from "anon";

revoke delete on table "public"."budget_variance_analysis" from "authenticated";

revoke insert on table "public"."budget_variance_analysis" from "authenticated";

revoke references on table "public"."budget_variance_analysis" from "authenticated";

revoke select on table "public"."budget_variance_analysis" from "authenticated";

revoke trigger on table "public"."budget_variance_analysis" from "authenticated";

revoke truncate on table "public"."budget_variance_analysis" from "authenticated";

revoke update on table "public"."budget_variance_analysis" from "authenticated";

revoke delete on table "public"."budget_variance_analysis" from "service_role";

revoke insert on table "public"."budget_variance_analysis" from "service_role";

revoke references on table "public"."budget_variance_analysis" from "service_role";

revoke select on table "public"."budget_variance_analysis" from "service_role";

revoke trigger on table "public"."budget_variance_analysis" from "service_role";

revoke truncate on table "public"."budget_variance_analysis" from "service_role";

revoke update on table "public"."budget_variance_analysis" from "service_role";

revoke delete on table "public"."budgets" from "anon";

revoke insert on table "public"."budgets" from "anon";

revoke references on table "public"."budgets" from "anon";

revoke select on table "public"."budgets" from "anon";

revoke trigger on table "public"."budgets" from "anon";

revoke truncate on table "public"."budgets" from "anon";

revoke update on table "public"."budgets" from "anon";

revoke delete on table "public"."budgets" from "authenticated";

revoke insert on table "public"."budgets" from "authenticated";

revoke references on table "public"."budgets" from "authenticated";

revoke select on table "public"."budgets" from "authenticated";

revoke trigger on table "public"."budgets" from "authenticated";

revoke truncate on table "public"."budgets" from "authenticated";

revoke update on table "public"."budgets" from "authenticated";

revoke delete on table "public"."budgets" from "service_role";

revoke insert on table "public"."budgets" from "service_role";

revoke references on table "public"."budgets" from "service_role";

revoke select on table "public"."budgets" from "service_role";

revoke trigger on table "public"."budgets" from "service_role";

revoke truncate on table "public"."budgets" from "service_role";

revoke update on table "public"."budgets" from "service_role";

revoke delete on table "public"."cache_settings" from "anon";

revoke insert on table "public"."cache_settings" from "anon";

revoke references on table "public"."cache_settings" from "anon";

revoke select on table "public"."cache_settings" from "anon";

revoke trigger on table "public"."cache_settings" from "anon";

revoke truncate on table "public"."cache_settings" from "anon";

revoke update on table "public"."cache_settings" from "anon";

revoke delete on table "public"."cache_settings" from "authenticated";

revoke insert on table "public"."cache_settings" from "authenticated";

revoke references on table "public"."cache_settings" from "authenticated";

revoke select on table "public"."cache_settings" from "authenticated";

revoke trigger on table "public"."cache_settings" from "authenticated";

revoke truncate on table "public"."cache_settings" from "authenticated";

revoke update on table "public"."cache_settings" from "authenticated";

revoke delete on table "public"."cache_settings" from "service_role";

revoke insert on table "public"."cache_settings" from "service_role";

revoke references on table "public"."cache_settings" from "service_role";

revoke select on table "public"."cache_settings" from "service_role";

revoke trigger on table "public"."cache_settings" from "service_role";

revoke truncate on table "public"."cache_settings" from "service_role";

revoke update on table "public"."cache_settings" from "service_role";

revoke delete on table "public"."career_progression" from "anon";

revoke insert on table "public"."career_progression" from "anon";

revoke references on table "public"."career_progression" from "anon";

revoke select on table "public"."career_progression" from "anon";

revoke trigger on table "public"."career_progression" from "anon";

revoke truncate on table "public"."career_progression" from "anon";

revoke update on table "public"."career_progression" from "anon";

revoke delete on table "public"."career_progression" from "authenticated";

revoke insert on table "public"."career_progression" from "authenticated";

revoke references on table "public"."career_progression" from "authenticated";

revoke select on table "public"."career_progression" from "authenticated";

revoke trigger on table "public"."career_progression" from "authenticated";

revoke truncate on table "public"."career_progression" from "authenticated";

revoke update on table "public"."career_progression" from "authenticated";

revoke delete on table "public"."career_progression" from "service_role";

revoke insert on table "public"."career_progression" from "service_role";

revoke references on table "public"."career_progression" from "service_role";

revoke select on table "public"."career_progression" from "service_role";

revoke trigger on table "public"."career_progression" from "service_role";

revoke truncate on table "public"."career_progression" from "service_role";

revoke update on table "public"."career_progression" from "service_role";

revoke delete on table "public"."cash_flow_predictions" from "anon";

revoke insert on table "public"."cash_flow_predictions" from "anon";

revoke references on table "public"."cash_flow_predictions" from "anon";

revoke select on table "public"."cash_flow_predictions" from "anon";

revoke trigger on table "public"."cash_flow_predictions" from "anon";

revoke truncate on table "public"."cash_flow_predictions" from "anon";

revoke update on table "public"."cash_flow_predictions" from "anon";

revoke delete on table "public"."cash_flow_predictions" from "authenticated";

revoke insert on table "public"."cash_flow_predictions" from "authenticated";

revoke references on table "public"."cash_flow_predictions" from "authenticated";

revoke select on table "public"."cash_flow_predictions" from "authenticated";

revoke trigger on table "public"."cash_flow_predictions" from "authenticated";

revoke truncate on table "public"."cash_flow_predictions" from "authenticated";

revoke update on table "public"."cash_flow_predictions" from "authenticated";

revoke delete on table "public"."cash_flow_predictions" from "service_role";

revoke insert on table "public"."cash_flow_predictions" from "service_role";

revoke references on table "public"."cash_flow_predictions" from "service_role";

revoke select on table "public"."cash_flow_predictions" from "service_role";

revoke trigger on table "public"."cash_flow_predictions" from "service_role";

revoke truncate on table "public"."cash_flow_predictions" from "service_role";

revoke update on table "public"."cash_flow_predictions" from "service_role";

revoke delete on table "public"."category_account_map" from "anon";

revoke insert on table "public"."category_account_map" from "anon";

revoke references on table "public"."category_account_map" from "anon";

revoke select on table "public"."category_account_map" from "anon";

revoke trigger on table "public"."category_account_map" from "anon";

revoke truncate on table "public"."category_account_map" from "anon";

revoke update on table "public"."category_account_map" from "anon";

revoke delete on table "public"."category_account_map" from "authenticated";

revoke insert on table "public"."category_account_map" from "authenticated";

revoke references on table "public"."category_account_map" from "authenticated";

revoke select on table "public"."category_account_map" from "authenticated";

revoke trigger on table "public"."category_account_map" from "authenticated";

revoke truncate on table "public"."category_account_map" from "authenticated";

revoke update on table "public"."category_account_map" from "authenticated";

revoke delete on table "public"."category_account_map" from "service_role";

revoke insert on table "public"."category_account_map" from "service_role";

revoke references on table "public"."category_account_map" from "service_role";

revoke select on table "public"."category_account_map" from "service_role";

revoke trigger on table "public"."category_account_map" from "service_role";

revoke truncate on table "public"."category_account_map" from "service_role";

revoke update on table "public"."category_account_map" from "service_role";

revoke delete on table "public"."chart_of_accounts" from "anon";

revoke insert on table "public"."chart_of_accounts" from "anon";

revoke references on table "public"."chart_of_accounts" from "anon";

revoke select on table "public"."chart_of_accounts" from "anon";

revoke trigger on table "public"."chart_of_accounts" from "anon";

revoke truncate on table "public"."chart_of_accounts" from "anon";

revoke update on table "public"."chart_of_accounts" from "anon";

revoke delete on table "public"."chart_of_accounts" from "authenticated";

revoke insert on table "public"."chart_of_accounts" from "authenticated";

revoke references on table "public"."chart_of_accounts" from "authenticated";

revoke select on table "public"."chart_of_accounts" from "authenticated";

revoke trigger on table "public"."chart_of_accounts" from "authenticated";

revoke truncate on table "public"."chart_of_accounts" from "authenticated";

revoke update on table "public"."chart_of_accounts" from "authenticated";

revoke delete on table "public"."chart_of_accounts" from "service_role";

revoke insert on table "public"."chart_of_accounts" from "service_role";

revoke references on table "public"."chart_of_accounts" from "service_role";

revoke select on table "public"."chart_of_accounts" from "service_role";

revoke trigger on table "public"."chart_of_accounts" from "service_role";

revoke truncate on table "public"."chart_of_accounts" from "service_role";

revoke update on table "public"."chart_of_accounts" from "service_role";

revoke delete on table "public"."chart_of_accounts_templates" from "anon";

revoke insert on table "public"."chart_of_accounts_templates" from "anon";

revoke references on table "public"."chart_of_accounts_templates" from "anon";

revoke select on table "public"."chart_of_accounts_templates" from "anon";

revoke trigger on table "public"."chart_of_accounts_templates" from "anon";

revoke truncate on table "public"."chart_of_accounts_templates" from "anon";

revoke update on table "public"."chart_of_accounts_templates" from "anon";

revoke delete on table "public"."chart_of_accounts_templates" from "authenticated";

revoke insert on table "public"."chart_of_accounts_templates" from "authenticated";

revoke references on table "public"."chart_of_accounts_templates" from "authenticated";

revoke select on table "public"."chart_of_accounts_templates" from "authenticated";

revoke trigger on table "public"."chart_of_accounts_templates" from "authenticated";

revoke truncate on table "public"."chart_of_accounts_templates" from "authenticated";

revoke update on table "public"."chart_of_accounts_templates" from "authenticated";

revoke delete on table "public"."chart_of_accounts_templates" from "service_role";

revoke insert on table "public"."chart_of_accounts_templates" from "service_role";

revoke references on table "public"."chart_of_accounts_templates" from "service_role";

revoke select on table "public"."chart_of_accounts_templates" from "service_role";

revoke trigger on table "public"."chart_of_accounts_templates" from "service_role";

revoke truncate on table "public"."chart_of_accounts_templates" from "service_role";

revoke update on table "public"."chart_of_accounts_templates" from "service_role";

revoke delete on table "public"."companies" from "anon";

revoke insert on table "public"."companies" from "anon";

revoke references on table "public"."companies" from "anon";

revoke select on table "public"."companies" from "anon";

revoke trigger on table "public"."companies" from "anon";

revoke truncate on table "public"."companies" from "anon";

revoke update on table "public"."companies" from "anon";

revoke delete on table "public"."companies" from "authenticated";

revoke insert on table "public"."companies" from "authenticated";

revoke references on table "public"."companies" from "authenticated";

revoke select on table "public"."companies" from "authenticated";

revoke trigger on table "public"."companies" from "authenticated";

revoke truncate on table "public"."companies" from "authenticated";

revoke update on table "public"."companies" from "authenticated";

revoke delete on table "public"."companies" from "service_role";

revoke insert on table "public"."companies" from "service_role";

revoke references on table "public"."companies" from "service_role";

revoke select on table "public"."companies" from "service_role";

revoke trigger on table "public"."companies" from "service_role";

revoke truncate on table "public"."companies" from "service_role";

revoke update on table "public"."companies" from "service_role";

revoke delete on table "public"."company_deletion_requests" from "anon";

revoke insert on table "public"."company_deletion_requests" from "anon";

revoke references on table "public"."company_deletion_requests" from "anon";

revoke select on table "public"."company_deletion_requests" from "anon";

revoke trigger on table "public"."company_deletion_requests" from "anon";

revoke truncate on table "public"."company_deletion_requests" from "anon";

revoke update on table "public"."company_deletion_requests" from "anon";

revoke delete on table "public"."company_deletion_requests" from "authenticated";

revoke insert on table "public"."company_deletion_requests" from "authenticated";

revoke references on table "public"."company_deletion_requests" from "authenticated";

revoke select on table "public"."company_deletion_requests" from "authenticated";

revoke trigger on table "public"."company_deletion_requests" from "authenticated";

revoke truncate on table "public"."company_deletion_requests" from "authenticated";

revoke update on table "public"."company_deletion_requests" from "authenticated";

revoke delete on table "public"."company_deletion_requests" from "service_role";

revoke insert on table "public"."company_deletion_requests" from "service_role";

revoke references on table "public"."company_deletion_requests" from "service_role";

revoke select on table "public"."company_deletion_requests" from "service_role";

revoke trigger on table "public"."company_deletion_requests" from "service_role";

revoke truncate on table "public"."company_deletion_requests" from "service_role";

revoke update on table "public"."company_deletion_requests" from "service_role";

revoke delete on table "public"."company_duplicates" from "anon";

revoke insert on table "public"."company_duplicates" from "anon";

revoke references on table "public"."company_duplicates" from "anon";

revoke select on table "public"."company_duplicates" from "anon";

revoke trigger on table "public"."company_duplicates" from "anon";

revoke truncate on table "public"."company_duplicates" from "anon";

revoke update on table "public"."company_duplicates" from "anon";

revoke delete on table "public"."company_duplicates" from "authenticated";

revoke insert on table "public"."company_duplicates" from "authenticated";

revoke references on table "public"."company_duplicates" from "authenticated";

revoke select on table "public"."company_duplicates" from "authenticated";

revoke trigger on table "public"."company_duplicates" from "authenticated";

revoke truncate on table "public"."company_duplicates" from "authenticated";

revoke update on table "public"."company_duplicates" from "authenticated";

revoke delete on table "public"."company_duplicates" from "service_role";

revoke insert on table "public"."company_duplicates" from "service_role";

revoke references on table "public"."company_duplicates" from "service_role";

revoke select on table "public"."company_duplicates" from "service_role";

revoke trigger on table "public"."company_duplicates" from "service_role";

revoke truncate on table "public"."company_duplicates" from "service_role";

revoke update on table "public"."company_duplicates" from "service_role";

revoke delete on table "public"."company_features" from "anon";

revoke insert on table "public"."company_features" from "anon";

revoke references on table "public"."company_features" from "anon";

revoke select on table "public"."company_features" from "anon";

revoke trigger on table "public"."company_features" from "anon";

revoke truncate on table "public"."company_features" from "anon";

revoke update on table "public"."company_features" from "anon";

revoke delete on table "public"."company_features" from "authenticated";

revoke insert on table "public"."company_features" from "authenticated";

revoke references on table "public"."company_features" from "authenticated";

revoke select on table "public"."company_features" from "authenticated";

revoke trigger on table "public"."company_features" from "authenticated";

revoke truncate on table "public"."company_features" from "authenticated";

revoke update on table "public"."company_features" from "authenticated";

revoke delete on table "public"."company_features" from "service_role";

revoke insert on table "public"."company_features" from "service_role";

revoke references on table "public"."company_features" from "service_role";

revoke select on table "public"."company_features" from "service_role";

revoke trigger on table "public"."company_features" from "service_role";

revoke truncate on table "public"."company_features" from "service_role";

revoke update on table "public"."company_features" from "service_role";

revoke delete on table "public"."company_fiscal_settings" from "anon";

revoke insert on table "public"."company_fiscal_settings" from "anon";

revoke references on table "public"."company_fiscal_settings" from "anon";

revoke select on table "public"."company_fiscal_settings" from "anon";

revoke trigger on table "public"."company_fiscal_settings" from "anon";

revoke truncate on table "public"."company_fiscal_settings" from "anon";

revoke update on table "public"."company_fiscal_settings" from "anon";

revoke delete on table "public"."company_fiscal_settings" from "authenticated";

revoke insert on table "public"."company_fiscal_settings" from "authenticated";

revoke references on table "public"."company_fiscal_settings" from "authenticated";

revoke select on table "public"."company_fiscal_settings" from "authenticated";

revoke trigger on table "public"."company_fiscal_settings" from "authenticated";

revoke truncate on table "public"."company_fiscal_settings" from "authenticated";

revoke update on table "public"."company_fiscal_settings" from "authenticated";

revoke delete on table "public"."company_fiscal_settings" from "service_role";

revoke insert on table "public"."company_fiscal_settings" from "service_role";

revoke references on table "public"."company_fiscal_settings" from "service_role";

revoke select on table "public"."company_fiscal_settings" from "service_role";

revoke trigger on table "public"."company_fiscal_settings" from "service_role";

revoke truncate on table "public"."company_fiscal_settings" from "service_role";

revoke update on table "public"."company_fiscal_settings" from "service_role";

revoke delete on table "public"."company_invitations" from "anon";

revoke insert on table "public"."company_invitations" from "anon";

revoke references on table "public"."company_invitations" from "anon";

revoke select on table "public"."company_invitations" from "anon";

revoke trigger on table "public"."company_invitations" from "anon";

revoke truncate on table "public"."company_invitations" from "anon";

revoke update on table "public"."company_invitations" from "anon";

revoke delete on table "public"."company_invitations" from "authenticated";

revoke insert on table "public"."company_invitations" from "authenticated";

revoke references on table "public"."company_invitations" from "authenticated";

revoke select on table "public"."company_invitations" from "authenticated";

revoke trigger on table "public"."company_invitations" from "authenticated";

revoke truncate on table "public"."company_invitations" from "authenticated";

revoke update on table "public"."company_invitations" from "authenticated";

revoke delete on table "public"."company_invitations" from "service_role";

revoke insert on table "public"."company_invitations" from "service_role";

revoke references on table "public"."company_invitations" from "service_role";

revoke select on table "public"."company_invitations" from "service_role";

revoke trigger on table "public"."company_invitations" from "service_role";

revoke truncate on table "public"."company_invitations" from "service_role";

revoke update on table "public"."company_invitations" from "service_role";

revoke delete on table "public"."company_merges" from "anon";

revoke insert on table "public"."company_merges" from "anon";

revoke references on table "public"."company_merges" from "anon";

revoke select on table "public"."company_merges" from "anon";

revoke trigger on table "public"."company_merges" from "anon";

revoke truncate on table "public"."company_merges" from "anon";

revoke update on table "public"."company_merges" from "anon";

revoke delete on table "public"."company_merges" from "authenticated";

revoke insert on table "public"."company_merges" from "authenticated";

revoke references on table "public"."company_merges" from "authenticated";

revoke select on table "public"."company_merges" from "authenticated";

revoke trigger on table "public"."company_merges" from "authenticated";

revoke truncate on table "public"."company_merges" from "authenticated";

revoke update on table "public"."company_merges" from "authenticated";

revoke delete on table "public"."company_merges" from "service_role";

revoke insert on table "public"."company_merges" from "service_role";

revoke references on table "public"."company_merges" from "service_role";

revoke select on table "public"."company_merges" from "service_role";

revoke trigger on table "public"."company_merges" from "service_role";

revoke truncate on table "public"."company_merges" from "service_role";

revoke update on table "public"."company_merges" from "service_role";

revoke delete on table "public"."company_modules" from "anon";

revoke insert on table "public"."company_modules" from "anon";

revoke references on table "public"."company_modules" from "anon";

revoke select on table "public"."company_modules" from "anon";

revoke trigger on table "public"."company_modules" from "anon";

revoke truncate on table "public"."company_modules" from "anon";

revoke update on table "public"."company_modules" from "anon";

revoke delete on table "public"."company_modules" from "authenticated";

revoke insert on table "public"."company_modules" from "authenticated";

revoke references on table "public"."company_modules" from "authenticated";

revoke select on table "public"."company_modules" from "authenticated";

revoke trigger on table "public"."company_modules" from "authenticated";

revoke truncate on table "public"."company_modules" from "authenticated";

revoke update on table "public"."company_modules" from "authenticated";

revoke delete on table "public"."company_modules" from "service_role";

revoke insert on table "public"."company_modules" from "service_role";

revoke references on table "public"."company_modules" from "service_role";

revoke select on table "public"."company_modules" from "service_role";

revoke trigger on table "public"."company_modules" from "service_role";

revoke truncate on table "public"."company_modules" from "service_role";

revoke update on table "public"."company_modules" from "service_role";

revoke delete on table "public"."company_settings" from "anon";

revoke insert on table "public"."company_settings" from "anon";

revoke references on table "public"."company_settings" from "anon";

revoke select on table "public"."company_settings" from "anon";

revoke trigger on table "public"."company_settings" from "anon";

revoke truncate on table "public"."company_settings" from "anon";

revoke update on table "public"."company_settings" from "anon";

revoke delete on table "public"."company_settings" from "authenticated";

revoke insert on table "public"."company_settings" from "authenticated";

revoke references on table "public"."company_settings" from "authenticated";

revoke select on table "public"."company_settings" from "authenticated";

revoke trigger on table "public"."company_settings" from "authenticated";

revoke truncate on table "public"."company_settings" from "authenticated";

revoke update on table "public"."company_settings" from "authenticated";

revoke delete on table "public"."company_settings" from "service_role";

revoke insert on table "public"."company_settings" from "service_role";

revoke references on table "public"."company_settings" from "service_role";

revoke select on table "public"."company_settings" from "service_role";

revoke trigger on table "public"."company_settings" from "service_role";

revoke truncate on table "public"."company_settings" from "service_role";

revoke update on table "public"."company_settings" from "service_role";

revoke delete on table "public"."company_sizes_catalog" from "anon";

revoke insert on table "public"."company_sizes_catalog" from "anon";

revoke references on table "public"."company_sizes_catalog" from "anon";

revoke select on table "public"."company_sizes_catalog" from "anon";

revoke trigger on table "public"."company_sizes_catalog" from "anon";

revoke truncate on table "public"."company_sizes_catalog" from "anon";

revoke update on table "public"."company_sizes_catalog" from "anon";

revoke delete on table "public"."company_sizes_catalog" from "authenticated";

revoke insert on table "public"."company_sizes_catalog" from "authenticated";

revoke references on table "public"."company_sizes_catalog" from "authenticated";

revoke select on table "public"."company_sizes_catalog" from "authenticated";

revoke trigger on table "public"."company_sizes_catalog" from "authenticated";

revoke truncate on table "public"."company_sizes_catalog" from "authenticated";

revoke update on table "public"."company_sizes_catalog" from "authenticated";

revoke delete on table "public"."company_sizes_catalog" from "service_role";

revoke insert on table "public"."company_sizes_catalog" from "service_role";

revoke references on table "public"."company_sizes_catalog" from "service_role";

revoke select on table "public"."company_sizes_catalog" from "service_role";

revoke trigger on table "public"."company_sizes_catalog" from "service_role";

revoke truncate on table "public"."company_sizes_catalog" from "service_role";

revoke update on table "public"."company_sizes_catalog" from "service_role";

revoke delete on table "public"."company_users" from "anon";

revoke insert on table "public"."company_users" from "anon";

revoke references on table "public"."company_users" from "anon";

revoke select on table "public"."company_users" from "anon";

revoke trigger on table "public"."company_users" from "anon";

revoke truncate on table "public"."company_users" from "anon";

revoke update on table "public"."company_users" from "anon";

revoke delete on table "public"."company_users" from "authenticated";

revoke insert on table "public"."company_users" from "authenticated";

revoke references on table "public"."company_users" from "authenticated";

revoke select on table "public"."company_users" from "authenticated";

revoke trigger on table "public"."company_users" from "authenticated";

revoke truncate on table "public"."company_users" from "authenticated";

revoke update on table "public"."company_users" from "authenticated";

revoke delete on table "public"."company_users" from "service_role";

revoke insert on table "public"."company_users" from "service_role";

revoke references on table "public"."company_users" from "service_role";

revoke select on table "public"."company_users" from "service_role";

revoke trigger on table "public"."company_users" from "service_role";

revoke truncate on table "public"."company_users" from "service_role";

revoke update on table "public"."company_users" from "service_role";

revoke delete on table "public"."compliance_reports" from "anon";

revoke insert on table "public"."compliance_reports" from "anon";

revoke references on table "public"."compliance_reports" from "anon";

revoke select on table "public"."compliance_reports" from "anon";

revoke trigger on table "public"."compliance_reports" from "anon";

revoke truncate on table "public"."compliance_reports" from "anon";

revoke update on table "public"."compliance_reports" from "anon";

revoke delete on table "public"."compliance_reports" from "authenticated";

revoke insert on table "public"."compliance_reports" from "authenticated";

revoke references on table "public"."compliance_reports" from "authenticated";

revoke select on table "public"."compliance_reports" from "authenticated";

revoke trigger on table "public"."compliance_reports" from "authenticated";

revoke truncate on table "public"."compliance_reports" from "authenticated";

revoke update on table "public"."compliance_reports" from "authenticated";

revoke delete on table "public"."compliance_reports" from "service_role";

revoke insert on table "public"."compliance_reports" from "service_role";

revoke references on table "public"."compliance_reports" from "service_role";

revoke select on table "public"."compliance_reports" from "service_role";

revoke trigger on table "public"."compliance_reports" from "service_role";

revoke truncate on table "public"."compliance_reports" from "service_role";

revoke update on table "public"."compliance_reports" from "service_role";

revoke delete on table "public"."configuration_categories" from "anon";

revoke insert on table "public"."configuration_categories" from "anon";

revoke references on table "public"."configuration_categories" from "anon";

revoke select on table "public"."configuration_categories" from "anon";

revoke trigger on table "public"."configuration_categories" from "anon";

revoke truncate on table "public"."configuration_categories" from "anon";

revoke update on table "public"."configuration_categories" from "anon";

revoke delete on table "public"."configuration_categories" from "authenticated";

revoke insert on table "public"."configuration_categories" from "authenticated";

revoke references on table "public"."configuration_categories" from "authenticated";

revoke select on table "public"."configuration_categories" from "authenticated";

revoke trigger on table "public"."configuration_categories" from "authenticated";

revoke truncate on table "public"."configuration_categories" from "authenticated";

revoke update on table "public"."configuration_categories" from "authenticated";

revoke delete on table "public"."configuration_categories" from "service_role";

revoke insert on table "public"."configuration_categories" from "service_role";

revoke references on table "public"."configuration_categories" from "service_role";

revoke select on table "public"."configuration_categories" from "service_role";

revoke trigger on table "public"."configuration_categories" from "service_role";

revoke truncate on table "public"."configuration_categories" from "service_role";

revoke update on table "public"."configuration_categories" from "service_role";

revoke delete on table "public"."contacts" from "anon";

revoke insert on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "anon";

revoke select on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke update on table "public"."contacts" from "anon";

revoke delete on table "public"."contacts" from "authenticated";

revoke insert on table "public"."contacts" from "authenticated";

revoke references on table "public"."contacts" from "authenticated";

revoke select on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke update on table "public"."contacts" from "authenticated";

revoke delete on table "public"."contacts" from "service_role";

revoke insert on table "public"."contacts" from "service_role";

revoke references on table "public"."contacts" from "service_role";

revoke select on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke update on table "public"."contacts" from "service_role";

revoke delete on table "public"."contract_alerts" from "anon";

revoke insert on table "public"."contract_alerts" from "anon";

revoke references on table "public"."contract_alerts" from "anon";

revoke select on table "public"."contract_alerts" from "anon";

revoke trigger on table "public"."contract_alerts" from "anon";

revoke truncate on table "public"."contract_alerts" from "anon";

revoke update on table "public"."contract_alerts" from "anon";

revoke delete on table "public"."contract_alerts" from "authenticated";

revoke insert on table "public"."contract_alerts" from "authenticated";

revoke references on table "public"."contract_alerts" from "authenticated";

revoke select on table "public"."contract_alerts" from "authenticated";

revoke trigger on table "public"."contract_alerts" from "authenticated";

revoke truncate on table "public"."contract_alerts" from "authenticated";

revoke update on table "public"."contract_alerts" from "authenticated";

revoke delete on table "public"."contract_alerts" from "service_role";

revoke insert on table "public"."contract_alerts" from "service_role";

revoke references on table "public"."contract_alerts" from "service_role";

revoke select on table "public"."contract_alerts" from "service_role";

revoke trigger on table "public"."contract_alerts" from "service_role";

revoke truncate on table "public"."contract_alerts" from "service_role";

revoke update on table "public"."contract_alerts" from "service_role";

revoke delete on table "public"."contract_amendments" from "anon";

revoke insert on table "public"."contract_amendments" from "anon";

revoke references on table "public"."contract_amendments" from "anon";

revoke select on table "public"."contract_amendments" from "anon";

revoke trigger on table "public"."contract_amendments" from "anon";

revoke truncate on table "public"."contract_amendments" from "anon";

revoke update on table "public"."contract_amendments" from "anon";

revoke delete on table "public"."contract_amendments" from "authenticated";

revoke insert on table "public"."contract_amendments" from "authenticated";

revoke references on table "public"."contract_amendments" from "authenticated";

revoke select on table "public"."contract_amendments" from "authenticated";

revoke trigger on table "public"."contract_amendments" from "authenticated";

revoke truncate on table "public"."contract_amendments" from "authenticated";

revoke update on table "public"."contract_amendments" from "authenticated";

revoke delete on table "public"."contract_amendments" from "service_role";

revoke insert on table "public"."contract_amendments" from "service_role";

revoke references on table "public"."contract_amendments" from "service_role";

revoke select on table "public"."contract_amendments" from "service_role";

revoke trigger on table "public"."contract_amendments" from "service_role";

revoke truncate on table "public"."contract_amendments" from "service_role";

revoke update on table "public"."contract_amendments" from "service_role";

revoke delete on table "public"."contract_approvals" from "anon";

revoke insert on table "public"."contract_approvals" from "anon";

revoke references on table "public"."contract_approvals" from "anon";

revoke select on table "public"."contract_approvals" from "anon";

revoke trigger on table "public"."contract_approvals" from "anon";

revoke truncate on table "public"."contract_approvals" from "anon";

revoke update on table "public"."contract_approvals" from "anon";

revoke delete on table "public"."contract_approvals" from "authenticated";

revoke insert on table "public"."contract_approvals" from "authenticated";

revoke references on table "public"."contract_approvals" from "authenticated";

revoke select on table "public"."contract_approvals" from "authenticated";

revoke trigger on table "public"."contract_approvals" from "authenticated";

revoke truncate on table "public"."contract_approvals" from "authenticated";

revoke update on table "public"."contract_approvals" from "authenticated";

revoke delete on table "public"."contract_approvals" from "service_role";

revoke insert on table "public"."contract_approvals" from "service_role";

revoke references on table "public"."contract_approvals" from "service_role";

revoke select on table "public"."contract_approvals" from "service_role";

revoke trigger on table "public"."contract_approvals" from "service_role";

revoke truncate on table "public"."contract_approvals" from "service_role";

revoke update on table "public"."contract_approvals" from "service_role";

revoke delete on table "public"."contract_billing" from "anon";

revoke insert on table "public"."contract_billing" from "anon";

revoke references on table "public"."contract_billing" from "anon";

revoke select on table "public"."contract_billing" from "anon";

revoke trigger on table "public"."contract_billing" from "anon";

revoke truncate on table "public"."contract_billing" from "anon";

revoke update on table "public"."contract_billing" from "anon";

revoke delete on table "public"."contract_billing" from "authenticated";

revoke insert on table "public"."contract_billing" from "authenticated";

revoke references on table "public"."contract_billing" from "authenticated";

revoke select on table "public"."contract_billing" from "authenticated";

revoke trigger on table "public"."contract_billing" from "authenticated";

revoke truncate on table "public"."contract_billing" from "authenticated";

revoke update on table "public"."contract_billing" from "authenticated";

revoke delete on table "public"."contract_billing" from "service_role";

revoke insert on table "public"."contract_billing" from "service_role";

revoke references on table "public"."contract_billing" from "service_role";

revoke select on table "public"."contract_billing" from "service_role";

revoke trigger on table "public"."contract_billing" from "service_role";

revoke truncate on table "public"."contract_billing" from "service_role";

revoke update on table "public"."contract_billing" from "service_role";

revoke delete on table "public"."contract_clauses" from "anon";

revoke insert on table "public"."contract_clauses" from "anon";

revoke references on table "public"."contract_clauses" from "anon";

revoke select on table "public"."contract_clauses" from "anon";

revoke trigger on table "public"."contract_clauses" from "anon";

revoke truncate on table "public"."contract_clauses" from "anon";

revoke update on table "public"."contract_clauses" from "anon";

revoke delete on table "public"."contract_clauses" from "authenticated";

revoke insert on table "public"."contract_clauses" from "authenticated";

revoke references on table "public"."contract_clauses" from "authenticated";

revoke select on table "public"."contract_clauses" from "authenticated";

revoke trigger on table "public"."contract_clauses" from "authenticated";

revoke truncate on table "public"."contract_clauses" from "authenticated";

revoke update on table "public"."contract_clauses" from "authenticated";

revoke delete on table "public"."contract_clauses" from "service_role";

revoke insert on table "public"."contract_clauses" from "service_role";

revoke references on table "public"."contract_clauses" from "service_role";

revoke select on table "public"."contract_clauses" from "service_role";

revoke trigger on table "public"."contract_clauses" from "service_role";

revoke truncate on table "public"."contract_clauses" from "service_role";

revoke update on table "public"."contract_clauses" from "service_role";

revoke delete on table "public"."contract_documents" from "anon";

revoke insert on table "public"."contract_documents" from "anon";

revoke references on table "public"."contract_documents" from "anon";

revoke select on table "public"."contract_documents" from "anon";

revoke trigger on table "public"."contract_documents" from "anon";

revoke truncate on table "public"."contract_documents" from "anon";

revoke update on table "public"."contract_documents" from "anon";

revoke delete on table "public"."contract_documents" from "authenticated";

revoke insert on table "public"."contract_documents" from "authenticated";

revoke references on table "public"."contract_documents" from "authenticated";

revoke select on table "public"."contract_documents" from "authenticated";

revoke trigger on table "public"."contract_documents" from "authenticated";

revoke truncate on table "public"."contract_documents" from "authenticated";

revoke update on table "public"."contract_documents" from "authenticated";

revoke delete on table "public"."contract_documents" from "service_role";

revoke insert on table "public"."contract_documents" from "service_role";

revoke references on table "public"."contract_documents" from "service_role";

revoke select on table "public"."contract_documents" from "service_role";

revoke trigger on table "public"."contract_documents" from "service_role";

revoke truncate on table "public"."contract_documents" from "service_role";

revoke update on table "public"."contract_documents" from "service_role";

revoke delete on table "public"."contract_kpi_tracking" from "anon";

revoke insert on table "public"."contract_kpi_tracking" from "anon";

revoke references on table "public"."contract_kpi_tracking" from "anon";

revoke select on table "public"."contract_kpi_tracking" from "anon";

revoke trigger on table "public"."contract_kpi_tracking" from "anon";

revoke truncate on table "public"."contract_kpi_tracking" from "anon";

revoke update on table "public"."contract_kpi_tracking" from "anon";

revoke delete on table "public"."contract_kpi_tracking" from "authenticated";

revoke insert on table "public"."contract_kpi_tracking" from "authenticated";

revoke references on table "public"."contract_kpi_tracking" from "authenticated";

revoke select on table "public"."contract_kpi_tracking" from "authenticated";

revoke trigger on table "public"."contract_kpi_tracking" from "authenticated";

revoke truncate on table "public"."contract_kpi_tracking" from "authenticated";

revoke update on table "public"."contract_kpi_tracking" from "authenticated";

revoke delete on table "public"."contract_kpi_tracking" from "service_role";

revoke insert on table "public"."contract_kpi_tracking" from "service_role";

revoke references on table "public"."contract_kpi_tracking" from "service_role";

revoke select on table "public"."contract_kpi_tracking" from "service_role";

revoke trigger on table "public"."contract_kpi_tracking" from "service_role";

revoke truncate on table "public"."contract_kpi_tracking" from "service_role";

revoke update on table "public"."contract_kpi_tracking" from "service_role";

revoke delete on table "public"."contract_kpis" from "anon";

revoke insert on table "public"."contract_kpis" from "anon";

revoke references on table "public"."contract_kpis" from "anon";

revoke select on table "public"."contract_kpis" from "anon";

revoke trigger on table "public"."contract_kpis" from "anon";

revoke truncate on table "public"."contract_kpis" from "anon";

revoke update on table "public"."contract_kpis" from "anon";

revoke delete on table "public"."contract_kpis" from "authenticated";

revoke insert on table "public"."contract_kpis" from "authenticated";

revoke references on table "public"."contract_kpis" from "authenticated";

revoke select on table "public"."contract_kpis" from "authenticated";

revoke trigger on table "public"."contract_kpis" from "authenticated";

revoke truncate on table "public"."contract_kpis" from "authenticated";

revoke update on table "public"."contract_kpis" from "authenticated";

revoke delete on table "public"."contract_kpis" from "service_role";

revoke insert on table "public"."contract_kpis" from "service_role";

revoke references on table "public"."contract_kpis" from "service_role";

revoke select on table "public"."contract_kpis" from "service_role";

revoke trigger on table "public"."contract_kpis" from "service_role";

revoke truncate on table "public"."contract_kpis" from "service_role";

revoke update on table "public"."contract_kpis" from "service_role";

revoke delete on table "public"."contract_milestones" from "anon";

revoke insert on table "public"."contract_milestones" from "anon";

revoke references on table "public"."contract_milestones" from "anon";

revoke select on table "public"."contract_milestones" from "anon";

revoke trigger on table "public"."contract_milestones" from "anon";

revoke truncate on table "public"."contract_milestones" from "anon";

revoke update on table "public"."contract_milestones" from "anon";

revoke delete on table "public"."contract_milestones" from "authenticated";

revoke insert on table "public"."contract_milestones" from "authenticated";

revoke references on table "public"."contract_milestones" from "authenticated";

revoke select on table "public"."contract_milestones" from "authenticated";

revoke trigger on table "public"."contract_milestones" from "authenticated";

revoke truncate on table "public"."contract_milestones" from "authenticated";

revoke update on table "public"."contract_milestones" from "authenticated";

revoke delete on table "public"."contract_milestones" from "service_role";

revoke insert on table "public"."contract_milestones" from "service_role";

revoke references on table "public"."contract_milestones" from "service_role";

revoke select on table "public"."contract_milestones" from "service_role";

revoke trigger on table "public"."contract_milestones" from "service_role";

revoke truncate on table "public"."contract_milestones" from "service_role";

revoke update on table "public"."contract_milestones" from "service_role";

revoke delete on table "public"."contract_parties" from "anon";

revoke insert on table "public"."contract_parties" from "anon";

revoke references on table "public"."contract_parties" from "anon";

revoke select on table "public"."contract_parties" from "anon";

revoke trigger on table "public"."contract_parties" from "anon";

revoke truncate on table "public"."contract_parties" from "anon";

revoke update on table "public"."contract_parties" from "anon";

revoke delete on table "public"."contract_parties" from "authenticated";

revoke insert on table "public"."contract_parties" from "authenticated";

revoke references on table "public"."contract_parties" from "authenticated";

revoke select on table "public"."contract_parties" from "authenticated";

revoke trigger on table "public"."contract_parties" from "authenticated";

revoke truncate on table "public"."contract_parties" from "authenticated";

revoke update on table "public"."contract_parties" from "authenticated";

revoke delete on table "public"."contract_parties" from "service_role";

revoke insert on table "public"."contract_parties" from "service_role";

revoke references on table "public"."contract_parties" from "service_role";

revoke select on table "public"."contract_parties" from "service_role";

revoke trigger on table "public"."contract_parties" from "service_role";

revoke truncate on table "public"."contract_parties" from "service_role";

revoke update on table "public"."contract_parties" from "service_role";

revoke delete on table "public"."contract_renewals" from "anon";

revoke insert on table "public"."contract_renewals" from "anon";

revoke references on table "public"."contract_renewals" from "anon";

revoke select on table "public"."contract_renewals" from "anon";

revoke trigger on table "public"."contract_renewals" from "anon";

revoke truncate on table "public"."contract_renewals" from "anon";

revoke update on table "public"."contract_renewals" from "anon";

revoke delete on table "public"."contract_renewals" from "authenticated";

revoke insert on table "public"."contract_renewals" from "authenticated";

revoke references on table "public"."contract_renewals" from "authenticated";

revoke select on table "public"."contract_renewals" from "authenticated";

revoke trigger on table "public"."contract_renewals" from "authenticated";

revoke truncate on table "public"."contract_renewals" from "authenticated";

revoke update on table "public"."contract_renewals" from "authenticated";

revoke delete on table "public"."contract_renewals" from "service_role";

revoke insert on table "public"."contract_renewals" from "service_role";

revoke references on table "public"."contract_renewals" from "service_role";

revoke select on table "public"."contract_renewals" from "service_role";

revoke trigger on table "public"."contract_renewals" from "service_role";

revoke truncate on table "public"."contract_renewals" from "service_role";

revoke update on table "public"."contract_renewals" from "service_role";

revoke delete on table "public"."contract_templates" from "anon";

revoke insert on table "public"."contract_templates" from "anon";

revoke references on table "public"."contract_templates" from "anon";

revoke select on table "public"."contract_templates" from "anon";

revoke trigger on table "public"."contract_templates" from "anon";

revoke truncate on table "public"."contract_templates" from "anon";

revoke update on table "public"."contract_templates" from "anon";

revoke delete on table "public"."contract_templates" from "authenticated";

revoke insert on table "public"."contract_templates" from "authenticated";

revoke references on table "public"."contract_templates" from "authenticated";

revoke select on table "public"."contract_templates" from "authenticated";

revoke trigger on table "public"."contract_templates" from "authenticated";

revoke truncate on table "public"."contract_templates" from "authenticated";

revoke update on table "public"."contract_templates" from "authenticated";

revoke delete on table "public"."contract_templates" from "service_role";

revoke insert on table "public"."contract_templates" from "service_role";

revoke references on table "public"."contract_templates" from "service_role";

revoke select on table "public"."contract_templates" from "service_role";

revoke trigger on table "public"."contract_templates" from "service_role";

revoke truncate on table "public"."contract_templates" from "service_role";

revoke update on table "public"."contract_templates" from "service_role";

revoke delete on table "public"."contract_terminations" from "anon";

revoke insert on table "public"."contract_terminations" from "anon";

revoke references on table "public"."contract_terminations" from "anon";

revoke select on table "public"."contract_terminations" from "anon";

revoke trigger on table "public"."contract_terminations" from "anon";

revoke truncate on table "public"."contract_terminations" from "anon";

revoke update on table "public"."contract_terminations" from "anon";

revoke delete on table "public"."contract_terminations" from "authenticated";

revoke insert on table "public"."contract_terminations" from "authenticated";

revoke references on table "public"."contract_terminations" from "authenticated";

revoke select on table "public"."contract_terminations" from "authenticated";

revoke trigger on table "public"."contract_terminations" from "authenticated";

revoke truncate on table "public"."contract_terminations" from "authenticated";

revoke update on table "public"."contract_terminations" from "authenticated";

revoke delete on table "public"."contract_terminations" from "service_role";

revoke insert on table "public"."contract_terminations" from "service_role";

revoke references on table "public"."contract_terminations" from "service_role";

revoke select on table "public"."contract_terminations" from "service_role";

revoke trigger on table "public"."contract_terminations" from "service_role";

revoke truncate on table "public"."contract_terminations" from "service_role";

revoke update on table "public"."contract_terminations" from "service_role";

revoke delete on table "public"."contract_types" from "anon";

revoke insert on table "public"."contract_types" from "anon";

revoke references on table "public"."contract_types" from "anon";

revoke select on table "public"."contract_types" from "anon";

revoke trigger on table "public"."contract_types" from "anon";

revoke truncate on table "public"."contract_types" from "anon";

revoke update on table "public"."contract_types" from "anon";

revoke delete on table "public"."contract_types" from "authenticated";

revoke insert on table "public"."contract_types" from "authenticated";

revoke references on table "public"."contract_types" from "authenticated";

revoke select on table "public"."contract_types" from "authenticated";

revoke trigger on table "public"."contract_types" from "authenticated";

revoke truncate on table "public"."contract_types" from "authenticated";

revoke update on table "public"."contract_types" from "authenticated";

revoke delete on table "public"."contract_types" from "service_role";

revoke insert on table "public"."contract_types" from "service_role";

revoke references on table "public"."contract_types" from "service_role";

revoke select on table "public"."contract_types" from "service_role";

revoke trigger on table "public"."contract_types" from "service_role";

revoke truncate on table "public"."contract_types" from "service_role";

revoke update on table "public"."contract_types" from "service_role";

revoke delete on table "public"."contracts" from "anon";

revoke insert on table "public"."contracts" from "anon";

revoke references on table "public"."contracts" from "anon";

revoke select on table "public"."contracts" from "anon";

revoke trigger on table "public"."contracts" from "anon";

revoke truncate on table "public"."contracts" from "anon";

revoke update on table "public"."contracts" from "anon";

revoke delete on table "public"."contracts" from "authenticated";

revoke insert on table "public"."contracts" from "authenticated";

revoke references on table "public"."contracts" from "authenticated";

revoke select on table "public"."contracts" from "authenticated";

revoke trigger on table "public"."contracts" from "authenticated";

revoke truncate on table "public"."contracts" from "authenticated";

revoke update on table "public"."contracts" from "authenticated";

revoke delete on table "public"."contracts" from "service_role";

revoke insert on table "public"."contracts" from "service_role";

revoke references on table "public"."contracts" from "service_role";

revoke select on table "public"."contracts" from "service_role";

revoke trigger on table "public"."contracts" from "service_role";

revoke truncate on table "public"."contracts" from "service_role";

revoke update on table "public"."contracts" from "service_role";

revoke delete on table "public"."cost_centers" from "anon";

revoke insert on table "public"."cost_centers" from "anon";

revoke references on table "public"."cost_centers" from "anon";

revoke select on table "public"."cost_centers" from "anon";

revoke trigger on table "public"."cost_centers" from "anon";

revoke truncate on table "public"."cost_centers" from "anon";

revoke update on table "public"."cost_centers" from "anon";

revoke delete on table "public"."cost_centers" from "authenticated";

revoke insert on table "public"."cost_centers" from "authenticated";

revoke references on table "public"."cost_centers" from "authenticated";

revoke select on table "public"."cost_centers" from "authenticated";

revoke trigger on table "public"."cost_centers" from "authenticated";

revoke truncate on table "public"."cost_centers" from "authenticated";

revoke update on table "public"."cost_centers" from "authenticated";

revoke delete on table "public"."cost_centers" from "service_role";

revoke insert on table "public"."cost_centers" from "service_role";

revoke references on table "public"."cost_centers" from "service_role";

revoke select on table "public"."cost_centers" from "service_role";

revoke trigger on table "public"."cost_centers" from "service_role";

revoke truncate on table "public"."cost_centers" from "service_role";

revoke update on table "public"."cost_centers" from "service_role";

revoke delete on table "public"."countries_catalog" from "anon";

revoke insert on table "public"."countries_catalog" from "anon";

revoke references on table "public"."countries_catalog" from "anon";

revoke select on table "public"."countries_catalog" from "anon";

revoke trigger on table "public"."countries_catalog" from "anon";

revoke truncate on table "public"."countries_catalog" from "anon";

revoke update on table "public"."countries_catalog" from "anon";

revoke delete on table "public"."countries_catalog" from "authenticated";

revoke insert on table "public"."countries_catalog" from "authenticated";

revoke references on table "public"."countries_catalog" from "authenticated";

revoke select on table "public"."countries_catalog" from "authenticated";

revoke trigger on table "public"."countries_catalog" from "authenticated";

revoke truncate on table "public"."countries_catalog" from "authenticated";

revoke update on table "public"."countries_catalog" from "authenticated";

revoke delete on table "public"."countries_catalog" from "service_role";

revoke insert on table "public"."countries_catalog" from "service_role";

revoke references on table "public"."countries_catalog" from "service_role";

revoke select on table "public"."countries_catalog" from "service_role";

revoke trigger on table "public"."countries_catalog" from "service_role";

revoke truncate on table "public"."countries_catalog" from "service_role";

revoke update on table "public"."countries_catalog" from "service_role";

revoke delete on table "public"."crm_actions" from "anon";

revoke insert on table "public"."crm_actions" from "anon";

revoke references on table "public"."crm_actions" from "anon";

revoke select on table "public"."crm_actions" from "anon";

revoke trigger on table "public"."crm_actions" from "anon";

revoke truncate on table "public"."crm_actions" from "anon";

revoke update on table "public"."crm_actions" from "anon";

revoke delete on table "public"."crm_actions" from "authenticated";

revoke insert on table "public"."crm_actions" from "authenticated";

revoke references on table "public"."crm_actions" from "authenticated";

revoke select on table "public"."crm_actions" from "authenticated";

revoke trigger on table "public"."crm_actions" from "authenticated";

revoke truncate on table "public"."crm_actions" from "authenticated";

revoke update on table "public"."crm_actions" from "authenticated";

revoke delete on table "public"."crm_actions" from "service_role";

revoke insert on table "public"."crm_actions" from "service_role";

revoke references on table "public"."crm_actions" from "service_role";

revoke select on table "public"."crm_actions" from "service_role";

revoke trigger on table "public"."crm_actions" from "service_role";

revoke truncate on table "public"."crm_actions" from "service_role";

revoke update on table "public"."crm_actions" from "service_role";

revoke delete on table "public"."crm_activities" from "anon";

revoke insert on table "public"."crm_activities" from "anon";

revoke references on table "public"."crm_activities" from "anon";

revoke select on table "public"."crm_activities" from "anon";

revoke trigger on table "public"."crm_activities" from "anon";

revoke truncate on table "public"."crm_activities" from "anon";

revoke update on table "public"."crm_activities" from "anon";

revoke delete on table "public"."crm_activities" from "authenticated";

revoke insert on table "public"."crm_activities" from "authenticated";

revoke references on table "public"."crm_activities" from "authenticated";

revoke select on table "public"."crm_activities" from "authenticated";

revoke trigger on table "public"."crm_activities" from "authenticated";

revoke truncate on table "public"."crm_activities" from "authenticated";

revoke update on table "public"."crm_activities" from "authenticated";

revoke delete on table "public"."crm_activities" from "service_role";

revoke insert on table "public"."crm_activities" from "service_role";

revoke references on table "public"."crm_activities" from "service_role";

revoke select on table "public"."crm_activities" from "service_role";

revoke trigger on table "public"."crm_activities" from "service_role";

revoke truncate on table "public"."crm_activities" from "service_role";

revoke update on table "public"."crm_activities" from "service_role";

revoke delete on table "public"."crm_attachments" from "anon";

revoke insert on table "public"."crm_attachments" from "anon";

revoke references on table "public"."crm_attachments" from "anon";

revoke select on table "public"."crm_attachments" from "anon";

revoke trigger on table "public"."crm_attachments" from "anon";

revoke truncate on table "public"."crm_attachments" from "anon";

revoke update on table "public"."crm_attachments" from "anon";

revoke delete on table "public"."crm_attachments" from "authenticated";

revoke insert on table "public"."crm_attachments" from "authenticated";

revoke references on table "public"."crm_attachments" from "authenticated";

revoke select on table "public"."crm_attachments" from "authenticated";

revoke trigger on table "public"."crm_attachments" from "authenticated";

revoke truncate on table "public"."crm_attachments" from "authenticated";

revoke update on table "public"."crm_attachments" from "authenticated";

revoke delete on table "public"."crm_attachments" from "service_role";

revoke insert on table "public"."crm_attachments" from "service_role";

revoke references on table "public"."crm_attachments" from "service_role";

revoke select on table "public"."crm_attachments" from "service_role";

revoke trigger on table "public"."crm_attachments" from "service_role";

revoke truncate on table "public"."crm_attachments" from "service_role";

revoke update on table "public"."crm_attachments" from "service_role";

revoke delete on table "public"."crm_campaigns" from "anon";

revoke insert on table "public"."crm_campaigns" from "anon";

revoke references on table "public"."crm_campaigns" from "anon";

revoke select on table "public"."crm_campaigns" from "anon";

revoke trigger on table "public"."crm_campaigns" from "anon";

revoke truncate on table "public"."crm_campaigns" from "anon";

revoke update on table "public"."crm_campaigns" from "anon";

revoke delete on table "public"."crm_campaigns" from "authenticated";

revoke insert on table "public"."crm_campaigns" from "authenticated";

revoke references on table "public"."crm_campaigns" from "authenticated";

revoke select on table "public"."crm_campaigns" from "authenticated";

revoke trigger on table "public"."crm_campaigns" from "authenticated";

revoke truncate on table "public"."crm_campaigns" from "authenticated";

revoke update on table "public"."crm_campaigns" from "authenticated";

revoke delete on table "public"."crm_campaigns" from "service_role";

revoke insert on table "public"."crm_campaigns" from "service_role";

revoke references on table "public"."crm_campaigns" from "service_role";

revoke select on table "public"."crm_campaigns" from "service_role";

revoke trigger on table "public"."crm_campaigns" from "service_role";

revoke truncate on table "public"."crm_campaigns" from "service_role";

revoke update on table "public"."crm_campaigns" from "service_role";

revoke delete on table "public"."crm_clients" from "anon";

revoke insert on table "public"."crm_clients" from "anon";

revoke references on table "public"."crm_clients" from "anon";

revoke select on table "public"."crm_clients" from "anon";

revoke trigger on table "public"."crm_clients" from "anon";

revoke truncate on table "public"."crm_clients" from "anon";

revoke update on table "public"."crm_clients" from "anon";

revoke delete on table "public"."crm_clients" from "authenticated";

revoke insert on table "public"."crm_clients" from "authenticated";

revoke references on table "public"."crm_clients" from "authenticated";

revoke select on table "public"."crm_clients" from "authenticated";

revoke trigger on table "public"."crm_clients" from "authenticated";

revoke truncate on table "public"."crm_clients" from "authenticated";

revoke update on table "public"."crm_clients" from "authenticated";

revoke delete on table "public"."crm_clients" from "service_role";

revoke insert on table "public"."crm_clients" from "service_role";

revoke references on table "public"."crm_clients" from "service_role";

revoke select on table "public"."crm_clients" from "service_role";

revoke trigger on table "public"."crm_clients" from "service_role";

revoke truncate on table "public"."crm_clients" from "service_role";

revoke update on table "public"."crm_clients" from "service_role";

revoke delete on table "public"."crm_contacts" from "anon";

revoke insert on table "public"."crm_contacts" from "anon";

revoke references on table "public"."crm_contacts" from "anon";

revoke select on table "public"."crm_contacts" from "anon";

revoke trigger on table "public"."crm_contacts" from "anon";

revoke truncate on table "public"."crm_contacts" from "anon";

revoke update on table "public"."crm_contacts" from "anon";

revoke delete on table "public"."crm_contacts" from "authenticated";

revoke insert on table "public"."crm_contacts" from "authenticated";

revoke references on table "public"."crm_contacts" from "authenticated";

revoke select on table "public"."crm_contacts" from "authenticated";

revoke trigger on table "public"."crm_contacts" from "authenticated";

revoke truncate on table "public"."crm_contacts" from "authenticated";

revoke update on table "public"."crm_contacts" from "authenticated";

revoke delete on table "public"."crm_contacts" from "service_role";

revoke insert on table "public"."crm_contacts" from "service_role";

revoke references on table "public"."crm_contacts" from "service_role";

revoke select on table "public"."crm_contacts" from "service_role";

revoke trigger on table "public"."crm_contacts" from "service_role";

revoke truncate on table "public"."crm_contacts" from "service_role";

revoke update on table "public"."crm_contacts" from "service_role";

revoke delete on table "public"."crm_entity_tags" from "anon";

revoke insert on table "public"."crm_entity_tags" from "anon";

revoke references on table "public"."crm_entity_tags" from "anon";

revoke select on table "public"."crm_entity_tags" from "anon";

revoke trigger on table "public"."crm_entity_tags" from "anon";

revoke truncate on table "public"."crm_entity_tags" from "anon";

revoke update on table "public"."crm_entity_tags" from "anon";

revoke delete on table "public"."crm_entity_tags" from "authenticated";

revoke insert on table "public"."crm_entity_tags" from "authenticated";

revoke references on table "public"."crm_entity_tags" from "authenticated";

revoke select on table "public"."crm_entity_tags" from "authenticated";

revoke trigger on table "public"."crm_entity_tags" from "authenticated";

revoke truncate on table "public"."crm_entity_tags" from "authenticated";

revoke update on table "public"."crm_entity_tags" from "authenticated";

revoke delete on table "public"."crm_entity_tags" from "service_role";

revoke insert on table "public"."crm_entity_tags" from "service_role";

revoke references on table "public"."crm_entity_tags" from "service_role";

revoke select on table "public"."crm_entity_tags" from "service_role";

revoke trigger on table "public"."crm_entity_tags" from "service_role";

revoke truncate on table "public"."crm_entity_tags" from "service_role";

revoke update on table "public"."crm_entity_tags" from "service_role";

revoke delete on table "public"."crm_leads" from "anon";

revoke insert on table "public"."crm_leads" from "anon";

revoke references on table "public"."crm_leads" from "anon";

revoke select on table "public"."crm_leads" from "anon";

revoke trigger on table "public"."crm_leads" from "anon";

revoke truncate on table "public"."crm_leads" from "anon";

revoke update on table "public"."crm_leads" from "anon";

revoke delete on table "public"."crm_leads" from "authenticated";

revoke insert on table "public"."crm_leads" from "authenticated";

revoke references on table "public"."crm_leads" from "authenticated";

revoke select on table "public"."crm_leads" from "authenticated";

revoke trigger on table "public"."crm_leads" from "authenticated";

revoke truncate on table "public"."crm_leads" from "authenticated";

revoke update on table "public"."crm_leads" from "authenticated";

revoke delete on table "public"."crm_leads" from "service_role";

revoke insert on table "public"."crm_leads" from "service_role";

revoke references on table "public"."crm_leads" from "service_role";

revoke select on table "public"."crm_leads" from "service_role";

revoke trigger on table "public"."crm_leads" from "service_role";

revoke truncate on table "public"."crm_leads" from "service_role";

revoke update on table "public"."crm_leads" from "service_role";

revoke delete on table "public"."crm_notes" from "anon";

revoke insert on table "public"."crm_notes" from "anon";

revoke references on table "public"."crm_notes" from "anon";

revoke select on table "public"."crm_notes" from "anon";

revoke trigger on table "public"."crm_notes" from "anon";

revoke truncate on table "public"."crm_notes" from "anon";

revoke update on table "public"."crm_notes" from "anon";

revoke delete on table "public"."crm_notes" from "authenticated";

revoke insert on table "public"."crm_notes" from "authenticated";

revoke references on table "public"."crm_notes" from "authenticated";

revoke select on table "public"."crm_notes" from "authenticated";

revoke trigger on table "public"."crm_notes" from "authenticated";

revoke truncate on table "public"."crm_notes" from "authenticated";

revoke update on table "public"."crm_notes" from "authenticated";

revoke delete on table "public"."crm_notes" from "service_role";

revoke insert on table "public"."crm_notes" from "service_role";

revoke references on table "public"."crm_notes" from "service_role";

revoke select on table "public"."crm_notes" from "service_role";

revoke trigger on table "public"."crm_notes" from "service_role";

revoke truncate on table "public"."crm_notes" from "service_role";

revoke update on table "public"."crm_notes" from "service_role";

revoke delete on table "public"."crm_opportunities" from "anon";

revoke insert on table "public"."crm_opportunities" from "anon";

revoke references on table "public"."crm_opportunities" from "anon";

revoke select on table "public"."crm_opportunities" from "anon";

revoke trigger on table "public"."crm_opportunities" from "anon";

revoke truncate on table "public"."crm_opportunities" from "anon";

revoke update on table "public"."crm_opportunities" from "anon";

revoke delete on table "public"."crm_opportunities" from "authenticated";

revoke insert on table "public"."crm_opportunities" from "authenticated";

revoke references on table "public"."crm_opportunities" from "authenticated";

revoke select on table "public"."crm_opportunities" from "authenticated";

revoke trigger on table "public"."crm_opportunities" from "authenticated";

revoke truncate on table "public"."crm_opportunities" from "authenticated";

revoke update on table "public"."crm_opportunities" from "authenticated";

revoke delete on table "public"."crm_opportunities" from "service_role";

revoke insert on table "public"."crm_opportunities" from "service_role";

revoke references on table "public"."crm_opportunities" from "service_role";

revoke select on table "public"."crm_opportunities" from "service_role";

revoke trigger on table "public"."crm_opportunities" from "service_role";

revoke truncate on table "public"."crm_opportunities" from "service_role";

revoke update on table "public"."crm_opportunities" from "service_role";

revoke delete on table "public"."crm_pipelines" from "anon";

revoke insert on table "public"."crm_pipelines" from "anon";

revoke references on table "public"."crm_pipelines" from "anon";

revoke select on table "public"."crm_pipelines" from "anon";

revoke trigger on table "public"."crm_pipelines" from "anon";

revoke truncate on table "public"."crm_pipelines" from "anon";

revoke update on table "public"."crm_pipelines" from "anon";

revoke delete on table "public"."crm_pipelines" from "authenticated";

revoke insert on table "public"."crm_pipelines" from "authenticated";

revoke references on table "public"."crm_pipelines" from "authenticated";

revoke select on table "public"."crm_pipelines" from "authenticated";

revoke trigger on table "public"."crm_pipelines" from "authenticated";

revoke truncate on table "public"."crm_pipelines" from "authenticated";

revoke update on table "public"."crm_pipelines" from "authenticated";

revoke delete on table "public"."crm_pipelines" from "service_role";

revoke insert on table "public"."crm_pipelines" from "service_role";

revoke references on table "public"."crm_pipelines" from "service_role";

revoke select on table "public"."crm_pipelines" from "service_role";

revoke trigger on table "public"."crm_pipelines" from "service_role";

revoke truncate on table "public"."crm_pipelines" from "service_role";

revoke update on table "public"."crm_pipelines" from "service_role";

revoke delete on table "public"."crm_sources" from "anon";

revoke insert on table "public"."crm_sources" from "anon";

revoke references on table "public"."crm_sources" from "anon";

revoke select on table "public"."crm_sources" from "anon";

revoke trigger on table "public"."crm_sources" from "anon";

revoke truncate on table "public"."crm_sources" from "anon";

revoke update on table "public"."crm_sources" from "anon";

revoke delete on table "public"."crm_sources" from "authenticated";

revoke insert on table "public"."crm_sources" from "authenticated";

revoke references on table "public"."crm_sources" from "authenticated";

revoke select on table "public"."crm_sources" from "authenticated";

revoke trigger on table "public"."crm_sources" from "authenticated";

revoke truncate on table "public"."crm_sources" from "authenticated";

revoke update on table "public"."crm_sources" from "authenticated";

revoke delete on table "public"."crm_sources" from "service_role";

revoke insert on table "public"."crm_sources" from "service_role";

revoke references on table "public"."crm_sources" from "service_role";

revoke select on table "public"."crm_sources" from "service_role";

revoke trigger on table "public"."crm_sources" from "service_role";

revoke truncate on table "public"."crm_sources" from "service_role";

revoke update on table "public"."crm_sources" from "service_role";

revoke delete on table "public"."crm_stages" from "anon";

revoke insert on table "public"."crm_stages" from "anon";

revoke references on table "public"."crm_stages" from "anon";

revoke select on table "public"."crm_stages" from "anon";

revoke trigger on table "public"."crm_stages" from "anon";

revoke truncate on table "public"."crm_stages" from "anon";

revoke update on table "public"."crm_stages" from "anon";

revoke delete on table "public"."crm_stages" from "authenticated";

revoke insert on table "public"."crm_stages" from "authenticated";

revoke references on table "public"."crm_stages" from "authenticated";

revoke select on table "public"."crm_stages" from "authenticated";

revoke trigger on table "public"."crm_stages" from "authenticated";

revoke truncate on table "public"."crm_stages" from "authenticated";

revoke update on table "public"."crm_stages" from "authenticated";

revoke delete on table "public"."crm_stages" from "service_role";

revoke insert on table "public"."crm_stages" from "service_role";

revoke references on table "public"."crm_stages" from "service_role";

revoke select on table "public"."crm_stages" from "service_role";

revoke trigger on table "public"."crm_stages" from "service_role";

revoke truncate on table "public"."crm_stages" from "service_role";

revoke update on table "public"."crm_stages" from "service_role";

revoke delete on table "public"."crm_tags" from "anon";

revoke insert on table "public"."crm_tags" from "anon";

revoke references on table "public"."crm_tags" from "anon";

revoke select on table "public"."crm_tags" from "anon";

revoke trigger on table "public"."crm_tags" from "anon";

revoke truncate on table "public"."crm_tags" from "anon";

revoke update on table "public"."crm_tags" from "anon";

revoke delete on table "public"."crm_tags" from "authenticated";

revoke insert on table "public"."crm_tags" from "authenticated";

revoke references on table "public"."crm_tags" from "authenticated";

revoke select on table "public"."crm_tags" from "authenticated";

revoke trigger on table "public"."crm_tags" from "authenticated";

revoke truncate on table "public"."crm_tags" from "authenticated";

revoke update on table "public"."crm_tags" from "authenticated";

revoke delete on table "public"."crm_tags" from "service_role";

revoke insert on table "public"."crm_tags" from "service_role";

revoke references on table "public"."crm_tags" from "service_role";

revoke select on table "public"."crm_tags" from "service_role";

revoke trigger on table "public"."crm_tags" from "service_role";

revoke truncate on table "public"."crm_tags" from "service_role";

revoke update on table "public"."crm_tags" from "service_role";

revoke delete on table "public"."crm_tasks" from "anon";

revoke insert on table "public"."crm_tasks" from "anon";

revoke references on table "public"."crm_tasks" from "anon";

revoke select on table "public"."crm_tasks" from "anon";

revoke trigger on table "public"."crm_tasks" from "anon";

revoke truncate on table "public"."crm_tasks" from "anon";

revoke update on table "public"."crm_tasks" from "anon";

revoke delete on table "public"."crm_tasks" from "authenticated";

revoke insert on table "public"."crm_tasks" from "authenticated";

revoke references on table "public"."crm_tasks" from "authenticated";

revoke select on table "public"."crm_tasks" from "authenticated";

revoke trigger on table "public"."crm_tasks" from "authenticated";

revoke truncate on table "public"."crm_tasks" from "authenticated";

revoke update on table "public"."crm_tasks" from "authenticated";

revoke delete on table "public"."crm_tasks" from "service_role";

revoke insert on table "public"."crm_tasks" from "service_role";

revoke references on table "public"."crm_tasks" from "service_role";

revoke select on table "public"."crm_tasks" from "service_role";

revoke trigger on table "public"."crm_tasks" from "service_role";

revoke truncate on table "public"."crm_tasks" from "service_role";

revoke update on table "public"."crm_tasks" from "service_role";

revoke delete on table "public"."currencies_catalog" from "anon";

revoke insert on table "public"."currencies_catalog" from "anon";

revoke references on table "public"."currencies_catalog" from "anon";

revoke select on table "public"."currencies_catalog" from "anon";

revoke trigger on table "public"."currencies_catalog" from "anon";

revoke truncate on table "public"."currencies_catalog" from "anon";

revoke update on table "public"."currencies_catalog" from "anon";

revoke delete on table "public"."currencies_catalog" from "authenticated";

revoke insert on table "public"."currencies_catalog" from "authenticated";

revoke references on table "public"."currencies_catalog" from "authenticated";

revoke select on table "public"."currencies_catalog" from "authenticated";

revoke trigger on table "public"."currencies_catalog" from "authenticated";

revoke truncate on table "public"."currencies_catalog" from "authenticated";

revoke update on table "public"."currencies_catalog" from "authenticated";

revoke delete on table "public"."currencies_catalog" from "service_role";

revoke insert on table "public"."currencies_catalog" from "service_role";

revoke references on table "public"."currencies_catalog" from "service_role";

revoke select on table "public"."currencies_catalog" from "service_role";

revoke trigger on table "public"."currencies_catalog" from "service_role";

revoke truncate on table "public"."currencies_catalog" from "service_role";

revoke update on table "public"."currencies_catalog" from "service_role";

revoke delete on table "public"."customers" from "anon";

revoke insert on table "public"."customers" from "anon";

revoke references on table "public"."customers" from "anon";

revoke select on table "public"."customers" from "anon";

revoke trigger on table "public"."customers" from "anon";

revoke truncate on table "public"."customers" from "anon";

revoke update on table "public"."customers" from "anon";

revoke delete on table "public"."customers" from "authenticated";

revoke insert on table "public"."customers" from "authenticated";

revoke references on table "public"."customers" from "authenticated";

revoke select on table "public"."customers" from "authenticated";

revoke trigger on table "public"."customers" from "authenticated";

revoke truncate on table "public"."customers" from "authenticated";

revoke update on table "public"."customers" from "authenticated";

revoke delete on table "public"."customers" from "service_role";

revoke insert on table "public"."customers" from "service_role";

revoke references on table "public"."customers" from "service_role";

revoke select on table "public"."customers" from "service_role";

revoke trigger on table "public"."customers" from "service_role";

revoke truncate on table "public"."customers" from "service_role";

revoke update on table "public"."customers" from "service_role";

revoke delete on table "public"."data_classification" from "anon";

revoke insert on table "public"."data_classification" from "anon";

revoke references on table "public"."data_classification" from "anon";

revoke select on table "public"."data_classification" from "anon";

revoke trigger on table "public"."data_classification" from "anon";

revoke truncate on table "public"."data_classification" from "anon";

revoke update on table "public"."data_classification" from "anon";

revoke delete on table "public"."data_classification" from "authenticated";

revoke insert on table "public"."data_classification" from "authenticated";

revoke references on table "public"."data_classification" from "authenticated";

revoke select on table "public"."data_classification" from "authenticated";

revoke trigger on table "public"."data_classification" from "authenticated";

revoke truncate on table "public"."data_classification" from "authenticated";

revoke update on table "public"."data_classification" from "authenticated";

revoke delete on table "public"."data_classification" from "service_role";

revoke insert on table "public"."data_classification" from "service_role";

revoke references on table "public"."data_classification" from "service_role";

revoke select on table "public"."data_classification" from "service_role";

revoke trigger on table "public"."data_classification" from "service_role";

revoke truncate on table "public"."data_classification" from "service_role";

revoke update on table "public"."data_classification" from "service_role";

revoke delete on table "public"."data_governance_audit" from "anon";

revoke insert on table "public"."data_governance_audit" from "anon";

revoke references on table "public"."data_governance_audit" from "anon";

revoke select on table "public"."data_governance_audit" from "anon";

revoke trigger on table "public"."data_governance_audit" from "anon";

revoke truncate on table "public"."data_governance_audit" from "anon";

revoke update on table "public"."data_governance_audit" from "anon";

revoke delete on table "public"."data_governance_audit" from "authenticated";

revoke insert on table "public"."data_governance_audit" from "authenticated";

revoke references on table "public"."data_governance_audit" from "authenticated";

revoke select on table "public"."data_governance_audit" from "authenticated";

revoke trigger on table "public"."data_governance_audit" from "authenticated";

revoke truncate on table "public"."data_governance_audit" from "authenticated";

revoke update on table "public"."data_governance_audit" from "authenticated";

revoke delete on table "public"."data_governance_audit" from "service_role";

revoke insert on table "public"."data_governance_audit" from "service_role";

revoke references on table "public"."data_governance_audit" from "service_role";

revoke select on table "public"."data_governance_audit" from "service_role";

revoke trigger on table "public"."data_governance_audit" from "service_role";

revoke truncate on table "public"."data_governance_audit" from "service_role";

revoke update on table "public"."data_governance_audit" from "service_role";

revoke delete on table "public"."data_retention_policies" from "anon";

revoke insert on table "public"."data_retention_policies" from "anon";

revoke references on table "public"."data_retention_policies" from "anon";

revoke select on table "public"."data_retention_policies" from "anon";

revoke trigger on table "public"."data_retention_policies" from "anon";

revoke truncate on table "public"."data_retention_policies" from "anon";

revoke update on table "public"."data_retention_policies" from "anon";

revoke delete on table "public"."data_retention_policies" from "authenticated";

revoke insert on table "public"."data_retention_policies" from "authenticated";

revoke references on table "public"."data_retention_policies" from "authenticated";

revoke select on table "public"."data_retention_policies" from "authenticated";

revoke trigger on table "public"."data_retention_policies" from "authenticated";

revoke truncate on table "public"."data_retention_policies" from "authenticated";

revoke update on table "public"."data_retention_policies" from "authenticated";

revoke delete on table "public"."data_retention_policies" from "service_role";

revoke insert on table "public"."data_retention_policies" from "service_role";

revoke references on table "public"."data_retention_policies" from "service_role";

revoke select on table "public"."data_retention_policies" from "service_role";

revoke trigger on table "public"."data_retention_policies" from "service_role";

revoke truncate on table "public"."data_retention_policies" from "service_role";

revoke update on table "public"."data_retention_policies" from "service_role";

revoke delete on table "public"."departments" from "anon";

revoke insert on table "public"."departments" from "anon";

revoke references on table "public"."departments" from "anon";

revoke select on table "public"."departments" from "anon";

revoke trigger on table "public"."departments" from "anon";

revoke truncate on table "public"."departments" from "anon";

revoke update on table "public"."departments" from "anon";

revoke delete on table "public"."departments" from "authenticated";

revoke insert on table "public"."departments" from "authenticated";

revoke references on table "public"."departments" from "authenticated";

revoke select on table "public"."departments" from "authenticated";

revoke trigger on table "public"."departments" from "authenticated";

revoke truncate on table "public"."departments" from "authenticated";

revoke update on table "public"."departments" from "authenticated";

revoke delete on table "public"."departments" from "service_role";

revoke insert on table "public"."departments" from "service_role";

revoke references on table "public"."departments" from "service_role";

revoke select on table "public"."departments" from "service_role";

revoke trigger on table "public"."departments" from "service_role";

revoke truncate on table "public"."departments" from "service_role";

revoke update on table "public"."departments" from "service_role";

revoke delete on table "public"."disciplinary_actions" from "anon";

revoke insert on table "public"."disciplinary_actions" from "anon";

revoke references on table "public"."disciplinary_actions" from "anon";

revoke select on table "public"."disciplinary_actions" from "anon";

revoke trigger on table "public"."disciplinary_actions" from "anon";

revoke truncate on table "public"."disciplinary_actions" from "anon";

revoke update on table "public"."disciplinary_actions" from "anon";

revoke delete on table "public"."disciplinary_actions" from "authenticated";

revoke insert on table "public"."disciplinary_actions" from "authenticated";

revoke references on table "public"."disciplinary_actions" from "authenticated";

revoke select on table "public"."disciplinary_actions" from "authenticated";

revoke trigger on table "public"."disciplinary_actions" from "authenticated";

revoke truncate on table "public"."disciplinary_actions" from "authenticated";

revoke update on table "public"."disciplinary_actions" from "authenticated";

revoke delete on table "public"."disciplinary_actions" from "service_role";

revoke insert on table "public"."disciplinary_actions" from "service_role";

revoke references on table "public"."disciplinary_actions" from "service_role";

revoke select on table "public"."disciplinary_actions" from "service_role";

revoke trigger on table "public"."disciplinary_actions" from "service_role";

revoke truncate on table "public"."disciplinary_actions" from "service_role";

revoke update on table "public"."disciplinary_actions" from "service_role";

revoke delete on table "public"."employee_benefits" from "anon";

revoke insert on table "public"."employee_benefits" from "anon";

revoke references on table "public"."employee_benefits" from "anon";

revoke select on table "public"."employee_benefits" from "anon";

revoke trigger on table "public"."employee_benefits" from "anon";

revoke truncate on table "public"."employee_benefits" from "anon";

revoke update on table "public"."employee_benefits" from "anon";

revoke delete on table "public"."employee_benefits" from "authenticated";

revoke insert on table "public"."employee_benefits" from "authenticated";

revoke references on table "public"."employee_benefits" from "authenticated";

revoke select on table "public"."employee_benefits" from "authenticated";

revoke trigger on table "public"."employee_benefits" from "authenticated";

revoke truncate on table "public"."employee_benefits" from "authenticated";

revoke update on table "public"."employee_benefits" from "authenticated";

revoke delete on table "public"."employee_benefits" from "service_role";

revoke insert on table "public"."employee_benefits" from "service_role";

revoke references on table "public"."employee_benefits" from "service_role";

revoke select on table "public"."employee_benefits" from "service_role";

revoke trigger on table "public"."employee_benefits" from "service_role";

revoke truncate on table "public"."employee_benefits" from "service_role";

revoke update on table "public"."employee_benefits" from "service_role";

revoke delete on table "public"."employee_contracts" from "anon";

revoke insert on table "public"."employee_contracts" from "anon";

revoke references on table "public"."employee_contracts" from "anon";

revoke select on table "public"."employee_contracts" from "anon";

revoke trigger on table "public"."employee_contracts" from "anon";

revoke truncate on table "public"."employee_contracts" from "anon";

revoke update on table "public"."employee_contracts" from "anon";

revoke delete on table "public"."employee_contracts" from "authenticated";

revoke insert on table "public"."employee_contracts" from "authenticated";

revoke references on table "public"."employee_contracts" from "authenticated";

revoke select on table "public"."employee_contracts" from "authenticated";

revoke trigger on table "public"."employee_contracts" from "authenticated";

revoke truncate on table "public"."employee_contracts" from "authenticated";

revoke update on table "public"."employee_contracts" from "authenticated";

revoke delete on table "public"."employee_contracts" from "service_role";

revoke insert on table "public"."employee_contracts" from "service_role";

revoke references on table "public"."employee_contracts" from "service_role";

revoke select on table "public"."employee_contracts" from "service_role";

revoke trigger on table "public"."employee_contracts" from "service_role";

revoke truncate on table "public"."employee_contracts" from "service_role";

revoke update on table "public"."employee_contracts" from "service_role";

revoke delete on table "public"."employee_documents" from "anon";

revoke insert on table "public"."employee_documents" from "anon";

revoke references on table "public"."employee_documents" from "anon";

revoke select on table "public"."employee_documents" from "anon";

revoke trigger on table "public"."employee_documents" from "anon";

revoke truncate on table "public"."employee_documents" from "anon";

revoke update on table "public"."employee_documents" from "anon";

revoke delete on table "public"."employee_documents" from "authenticated";

revoke insert on table "public"."employee_documents" from "authenticated";

revoke references on table "public"."employee_documents" from "authenticated";

revoke select on table "public"."employee_documents" from "authenticated";

revoke trigger on table "public"."employee_documents" from "authenticated";

revoke truncate on table "public"."employee_documents" from "authenticated";

revoke update on table "public"."employee_documents" from "authenticated";

revoke delete on table "public"."employee_documents" from "service_role";

revoke insert on table "public"."employee_documents" from "service_role";

revoke references on table "public"."employee_documents" from "service_role";

revoke select on table "public"."employee_documents" from "service_role";

revoke trigger on table "public"."employee_documents" from "service_role";

revoke truncate on table "public"."employee_documents" from "service_role";

revoke update on table "public"."employee_documents" from "service_role";

revoke delete on table "public"."employee_surveys" from "anon";

revoke insert on table "public"."employee_surveys" from "anon";

revoke references on table "public"."employee_surveys" from "anon";

revoke select on table "public"."employee_surveys" from "anon";

revoke trigger on table "public"."employee_surveys" from "anon";

revoke truncate on table "public"."employee_surveys" from "anon";

revoke update on table "public"."employee_surveys" from "anon";

revoke delete on table "public"."employee_surveys" from "authenticated";

revoke insert on table "public"."employee_surveys" from "authenticated";

revoke references on table "public"."employee_surveys" from "authenticated";

revoke select on table "public"."employee_surveys" from "authenticated";

revoke trigger on table "public"."employee_surveys" from "authenticated";

revoke truncate on table "public"."employee_surveys" from "authenticated";

revoke update on table "public"."employee_surveys" from "authenticated";

revoke delete on table "public"."employee_surveys" from "service_role";

revoke insert on table "public"."employee_surveys" from "service_role";

revoke references on table "public"."employee_surveys" from "service_role";

revoke select on table "public"."employee_surveys" from "service_role";

revoke trigger on table "public"."employee_surveys" from "service_role";

revoke truncate on table "public"."employee_surveys" from "service_role";

revoke update on table "public"."employee_surveys" from "service_role";

revoke delete on table "public"."employees" from "anon";

revoke insert on table "public"."employees" from "anon";

revoke references on table "public"."employees" from "anon";

revoke select on table "public"."employees" from "anon";

revoke trigger on table "public"."employees" from "anon";

revoke truncate on table "public"."employees" from "anon";

revoke update on table "public"."employees" from "anon";

revoke delete on table "public"."employees" from "authenticated";

revoke insert on table "public"."employees" from "authenticated";

revoke references on table "public"."employees" from "authenticated";

revoke select on table "public"."employees" from "authenticated";

revoke trigger on table "public"."employees" from "authenticated";

revoke truncate on table "public"."employees" from "authenticated";

revoke update on table "public"."employees" from "authenticated";

revoke delete on table "public"."employees" from "service_role";

revoke insert on table "public"."employees" from "service_role";

revoke references on table "public"."employees" from "service_role";

revoke select on table "public"."employees" from "service_role";

revoke trigger on table "public"."employees" from "service_role";

revoke truncate on table "public"."employees" from "service_role";

revoke update on table "public"."employees" from "service_role";

revoke delete on table "public"."encryption_keys" from "anon";

revoke insert on table "public"."encryption_keys" from "anon";

revoke references on table "public"."encryption_keys" from "anon";

revoke select on table "public"."encryption_keys" from "anon";

revoke trigger on table "public"."encryption_keys" from "anon";

revoke truncate on table "public"."encryption_keys" from "anon";

revoke update on table "public"."encryption_keys" from "anon";

revoke delete on table "public"."encryption_keys" from "authenticated";

revoke insert on table "public"."encryption_keys" from "authenticated";

revoke references on table "public"."encryption_keys" from "authenticated";

revoke select on table "public"."encryption_keys" from "authenticated";

revoke trigger on table "public"."encryption_keys" from "authenticated";

revoke truncate on table "public"."encryption_keys" from "authenticated";

revoke update on table "public"."encryption_keys" from "authenticated";

revoke delete on table "public"."encryption_keys" from "service_role";

revoke insert on table "public"."encryption_keys" from "service_role";

revoke references on table "public"."encryption_keys" from "service_role";

revoke select on table "public"."encryption_keys" from "service_role";

revoke trigger on table "public"."encryption_keys" from "service_role";

revoke truncate on table "public"."encryption_keys" from "service_role";

revoke update on table "public"."encryption_keys" from "service_role";

revoke delete on table "public"."feature_flags" from "anon";

revoke insert on table "public"."feature_flags" from "anon";

revoke references on table "public"."feature_flags" from "anon";

revoke select on table "public"."feature_flags" from "anon";

revoke trigger on table "public"."feature_flags" from "anon";

revoke truncate on table "public"."feature_flags" from "anon";

revoke update on table "public"."feature_flags" from "anon";

revoke delete on table "public"."feature_flags" from "authenticated";

revoke insert on table "public"."feature_flags" from "authenticated";

revoke references on table "public"."feature_flags" from "authenticated";

revoke select on table "public"."feature_flags" from "authenticated";

revoke trigger on table "public"."feature_flags" from "authenticated";

revoke truncate on table "public"."feature_flags" from "authenticated";

revoke update on table "public"."feature_flags" from "authenticated";

revoke delete on table "public"."feature_flags" from "service_role";

revoke insert on table "public"."feature_flags" from "service_role";

revoke references on table "public"."feature_flags" from "service_role";

revoke select on table "public"."feature_flags" from "service_role";

revoke trigger on table "public"."feature_flags" from "service_role";

revoke truncate on table "public"."feature_flags" from "service_role";

revoke update on table "public"."feature_flags" from "service_role";

revoke delete on table "public"."feature_usage_tracking" from "anon";

revoke insert on table "public"."feature_usage_tracking" from "anon";

revoke references on table "public"."feature_usage_tracking" from "anon";

revoke select on table "public"."feature_usage_tracking" from "anon";

revoke trigger on table "public"."feature_usage_tracking" from "anon";

revoke truncate on table "public"."feature_usage_tracking" from "anon";

revoke update on table "public"."feature_usage_tracking" from "anon";

revoke delete on table "public"."feature_usage_tracking" from "authenticated";

revoke insert on table "public"."feature_usage_tracking" from "authenticated";

revoke references on table "public"."feature_usage_tracking" from "authenticated";

revoke select on table "public"."feature_usage_tracking" from "authenticated";

revoke trigger on table "public"."feature_usage_tracking" from "authenticated";

revoke truncate on table "public"."feature_usage_tracking" from "authenticated";

revoke update on table "public"."feature_usage_tracking" from "authenticated";

revoke delete on table "public"."feature_usage_tracking" from "service_role";

revoke insert on table "public"."feature_usage_tracking" from "service_role";

revoke references on table "public"."feature_usage_tracking" from "service_role";

revoke select on table "public"."feature_usage_tracking" from "service_role";

revoke trigger on table "public"."feature_usage_tracking" from "service_role";

revoke truncate on table "public"."feature_usage_tracking" from "service_role";

revoke update on table "public"."feature_usage_tracking" from "service_role";

revoke delete on table "public"."fec_exports" from "anon";

revoke insert on table "public"."fec_exports" from "anon";

revoke references on table "public"."fec_exports" from "anon";

revoke select on table "public"."fec_exports" from "anon";

revoke trigger on table "public"."fec_exports" from "anon";

revoke truncate on table "public"."fec_exports" from "anon";

revoke update on table "public"."fec_exports" from "anon";

revoke delete on table "public"."fec_exports" from "authenticated";

revoke insert on table "public"."fec_exports" from "authenticated";

revoke references on table "public"."fec_exports" from "authenticated";

revoke select on table "public"."fec_exports" from "authenticated";

revoke trigger on table "public"."fec_exports" from "authenticated";

revoke truncate on table "public"."fec_exports" from "authenticated";

revoke update on table "public"."fec_exports" from "authenticated";

revoke delete on table "public"."fec_exports" from "service_role";

revoke insert on table "public"."fec_exports" from "service_role";

revoke references on table "public"."fec_exports" from "service_role";

revoke select on table "public"."fec_exports" from "service_role";

revoke trigger on table "public"."fec_exports" from "service_role";

revoke truncate on table "public"."fec_exports" from "service_role";

revoke update on table "public"."fec_exports" from "service_role";

revoke delete on table "public"."financial_reports" from "anon";

revoke insert on table "public"."financial_reports" from "anon";

revoke references on table "public"."financial_reports" from "anon";

revoke select on table "public"."financial_reports" from "anon";

revoke trigger on table "public"."financial_reports" from "anon";

revoke truncate on table "public"."financial_reports" from "anon";

revoke update on table "public"."financial_reports" from "anon";

revoke delete on table "public"."financial_reports" from "authenticated";

revoke insert on table "public"."financial_reports" from "authenticated";

revoke references on table "public"."financial_reports" from "authenticated";

revoke select on table "public"."financial_reports" from "authenticated";

revoke trigger on table "public"."financial_reports" from "authenticated";

revoke truncate on table "public"."financial_reports" from "authenticated";

revoke update on table "public"."financial_reports" from "authenticated";

revoke delete on table "public"."financial_reports" from "service_role";

revoke insert on table "public"."financial_reports" from "service_role";

revoke references on table "public"."financial_reports" from "service_role";

revoke select on table "public"."financial_reports" from "service_role";

revoke trigger on table "public"."financial_reports" from "service_role";

revoke truncate on table "public"."financial_reports" from "service_role";

revoke update on table "public"."financial_reports" from "service_role";

revoke delete on table "public"."fiscal_country_templates" from "anon";

revoke insert on table "public"."fiscal_country_templates" from "anon";

revoke references on table "public"."fiscal_country_templates" from "anon";

revoke select on table "public"."fiscal_country_templates" from "anon";

revoke trigger on table "public"."fiscal_country_templates" from "anon";

revoke truncate on table "public"."fiscal_country_templates" from "anon";

revoke update on table "public"."fiscal_country_templates" from "anon";

revoke delete on table "public"."fiscal_country_templates" from "authenticated";

revoke insert on table "public"."fiscal_country_templates" from "authenticated";

revoke references on table "public"."fiscal_country_templates" from "authenticated";

revoke select on table "public"."fiscal_country_templates" from "authenticated";

revoke trigger on table "public"."fiscal_country_templates" from "authenticated";

revoke truncate on table "public"."fiscal_country_templates" from "authenticated";

revoke update on table "public"."fiscal_country_templates" from "authenticated";

revoke delete on table "public"."fiscal_country_templates" from "service_role";

revoke insert on table "public"."fiscal_country_templates" from "service_role";

revoke references on table "public"."fiscal_country_templates" from "service_role";

revoke select on table "public"."fiscal_country_templates" from "service_role";

revoke trigger on table "public"."fiscal_country_templates" from "service_role";

revoke truncate on table "public"."fiscal_country_templates" from "service_role";

revoke update on table "public"."fiscal_country_templates" from "service_role";

revoke delete on table "public"."inventory_adjustments" from "anon";

revoke insert on table "public"."inventory_adjustments" from "anon";

revoke references on table "public"."inventory_adjustments" from "anon";

revoke select on table "public"."inventory_adjustments" from "anon";

revoke trigger on table "public"."inventory_adjustments" from "anon";

revoke truncate on table "public"."inventory_adjustments" from "anon";

revoke update on table "public"."inventory_adjustments" from "anon";

revoke delete on table "public"."inventory_adjustments" from "authenticated";

revoke insert on table "public"."inventory_adjustments" from "authenticated";

revoke references on table "public"."inventory_adjustments" from "authenticated";

revoke select on table "public"."inventory_adjustments" from "authenticated";

revoke trigger on table "public"."inventory_adjustments" from "authenticated";

revoke truncate on table "public"."inventory_adjustments" from "authenticated";

revoke update on table "public"."inventory_adjustments" from "authenticated";

revoke delete on table "public"."inventory_adjustments" from "service_role";

revoke insert on table "public"."inventory_adjustments" from "service_role";

revoke references on table "public"."inventory_adjustments" from "service_role";

revoke select on table "public"."inventory_adjustments" from "service_role";

revoke trigger on table "public"."inventory_adjustments" from "service_role";

revoke truncate on table "public"."inventory_adjustments" from "service_role";

revoke update on table "public"."inventory_adjustments" from "service_role";

revoke delete on table "public"."inventory_items" from "anon";

revoke insert on table "public"."inventory_items" from "anon";

revoke references on table "public"."inventory_items" from "anon";

revoke select on table "public"."inventory_items" from "anon";

revoke trigger on table "public"."inventory_items" from "anon";

revoke truncate on table "public"."inventory_items" from "anon";

revoke update on table "public"."inventory_items" from "anon";

revoke delete on table "public"."inventory_items" from "authenticated";

revoke insert on table "public"."inventory_items" from "authenticated";

revoke references on table "public"."inventory_items" from "authenticated";

revoke select on table "public"."inventory_items" from "authenticated";

revoke trigger on table "public"."inventory_items" from "authenticated";

revoke truncate on table "public"."inventory_items" from "authenticated";

revoke update on table "public"."inventory_items" from "authenticated";

revoke delete on table "public"."inventory_items" from "service_role";

revoke insert on table "public"."inventory_items" from "service_role";

revoke references on table "public"."inventory_items" from "service_role";

revoke select on table "public"."inventory_items" from "service_role";

revoke trigger on table "public"."inventory_items" from "service_role";

revoke truncate on table "public"."inventory_items" from "service_role";

revoke update on table "public"."inventory_items" from "service_role";

revoke delete on table "public"."inventory_locations" from "anon";

revoke insert on table "public"."inventory_locations" from "anon";

revoke references on table "public"."inventory_locations" from "anon";

revoke select on table "public"."inventory_locations" from "anon";

revoke trigger on table "public"."inventory_locations" from "anon";

revoke truncate on table "public"."inventory_locations" from "anon";

revoke update on table "public"."inventory_locations" from "anon";

revoke delete on table "public"."inventory_locations" from "authenticated";

revoke insert on table "public"."inventory_locations" from "authenticated";

revoke references on table "public"."inventory_locations" from "authenticated";

revoke select on table "public"."inventory_locations" from "authenticated";

revoke trigger on table "public"."inventory_locations" from "authenticated";

revoke truncate on table "public"."inventory_locations" from "authenticated";

revoke update on table "public"."inventory_locations" from "authenticated";

revoke delete on table "public"."inventory_locations" from "service_role";

revoke insert on table "public"."inventory_locations" from "service_role";

revoke references on table "public"."inventory_locations" from "service_role";

revoke select on table "public"."inventory_locations" from "service_role";

revoke trigger on table "public"."inventory_locations" from "service_role";

revoke truncate on table "public"."inventory_locations" from "service_role";

revoke update on table "public"."inventory_locations" from "service_role";

revoke delete on table "public"."inventory_movements" from "anon";

revoke insert on table "public"."inventory_movements" from "anon";

revoke references on table "public"."inventory_movements" from "anon";

revoke select on table "public"."inventory_movements" from "anon";

revoke trigger on table "public"."inventory_movements" from "anon";

revoke truncate on table "public"."inventory_movements" from "anon";

revoke update on table "public"."inventory_movements" from "anon";

revoke delete on table "public"."inventory_movements" from "authenticated";

revoke insert on table "public"."inventory_movements" from "authenticated";

revoke references on table "public"."inventory_movements" from "authenticated";

revoke select on table "public"."inventory_movements" from "authenticated";

revoke trigger on table "public"."inventory_movements" from "authenticated";

revoke truncate on table "public"."inventory_movements" from "authenticated";

revoke update on table "public"."inventory_movements" from "authenticated";

revoke delete on table "public"."inventory_movements" from "service_role";

revoke insert on table "public"."inventory_movements" from "service_role";

revoke references on table "public"."inventory_movements" from "service_role";

revoke select on table "public"."inventory_movements" from "service_role";

revoke trigger on table "public"."inventory_movements" from "service_role";

revoke truncate on table "public"."inventory_movements" from "service_role";

revoke update on table "public"."inventory_movements" from "service_role";

revoke delete on table "public"."invoice_items" from "anon";

revoke insert on table "public"."invoice_items" from "anon";

revoke references on table "public"."invoice_items" from "anon";

revoke select on table "public"."invoice_items" from "anon";

revoke trigger on table "public"."invoice_items" from "anon";

revoke truncate on table "public"."invoice_items" from "anon";

revoke update on table "public"."invoice_items" from "anon";

revoke delete on table "public"."invoice_items" from "authenticated";

revoke insert on table "public"."invoice_items" from "authenticated";

revoke references on table "public"."invoice_items" from "authenticated";

revoke select on table "public"."invoice_items" from "authenticated";

revoke trigger on table "public"."invoice_items" from "authenticated";

revoke truncate on table "public"."invoice_items" from "authenticated";

revoke update on table "public"."invoice_items" from "authenticated";

revoke delete on table "public"."invoice_items" from "service_role";

revoke insert on table "public"."invoice_items" from "service_role";

revoke references on table "public"."invoice_items" from "service_role";

revoke select on table "public"."invoice_items" from "service_role";

revoke trigger on table "public"."invoice_items" from "service_role";

revoke truncate on table "public"."invoice_items" from "service_role";

revoke update on table "public"."invoice_items" from "service_role";

revoke delete on table "public"."invoice_lines" from "anon";

revoke insert on table "public"."invoice_lines" from "anon";

revoke references on table "public"."invoice_lines" from "anon";

revoke select on table "public"."invoice_lines" from "anon";

revoke trigger on table "public"."invoice_lines" from "anon";

revoke truncate on table "public"."invoice_lines" from "anon";

revoke update on table "public"."invoice_lines" from "anon";

revoke delete on table "public"."invoice_lines" from "authenticated";

revoke insert on table "public"."invoice_lines" from "authenticated";

revoke references on table "public"."invoice_lines" from "authenticated";

revoke select on table "public"."invoice_lines" from "authenticated";

revoke trigger on table "public"."invoice_lines" from "authenticated";

revoke truncate on table "public"."invoice_lines" from "authenticated";

revoke update on table "public"."invoice_lines" from "authenticated";

revoke delete on table "public"."invoice_lines" from "service_role";

revoke insert on table "public"."invoice_lines" from "service_role";

revoke references on table "public"."invoice_lines" from "service_role";

revoke select on table "public"."invoice_lines" from "service_role";

revoke trigger on table "public"."invoice_lines" from "service_role";

revoke truncate on table "public"."invoice_lines" from "service_role";

revoke update on table "public"."invoice_lines" from "service_role";

revoke delete on table "public"."invoice_templates" from "anon";

revoke insert on table "public"."invoice_templates" from "anon";

revoke references on table "public"."invoice_templates" from "anon";

revoke select on table "public"."invoice_templates" from "anon";

revoke trigger on table "public"."invoice_templates" from "anon";

revoke truncate on table "public"."invoice_templates" from "anon";

revoke update on table "public"."invoice_templates" from "anon";

revoke delete on table "public"."invoice_templates" from "authenticated";

revoke insert on table "public"."invoice_templates" from "authenticated";

revoke references on table "public"."invoice_templates" from "authenticated";

revoke select on table "public"."invoice_templates" from "authenticated";

revoke trigger on table "public"."invoice_templates" from "authenticated";

revoke truncate on table "public"."invoice_templates" from "authenticated";

revoke update on table "public"."invoice_templates" from "authenticated";

revoke delete on table "public"."invoice_templates" from "service_role";

revoke insert on table "public"."invoice_templates" from "service_role";

revoke references on table "public"."invoice_templates" from "service_role";

revoke select on table "public"."invoice_templates" from "service_role";

revoke trigger on table "public"."invoice_templates" from "service_role";

revoke truncate on table "public"."invoice_templates" from "service_role";

revoke update on table "public"."invoice_templates" from "service_role";

revoke delete on table "public"."invoices" from "anon";

revoke insert on table "public"."invoices" from "anon";

revoke references on table "public"."invoices" from "anon";

revoke select on table "public"."invoices" from "anon";

revoke trigger on table "public"."invoices" from "anon";

revoke truncate on table "public"."invoices" from "anon";

revoke update on table "public"."invoices" from "anon";

revoke delete on table "public"."invoices" from "authenticated";

revoke insert on table "public"."invoices" from "authenticated";

revoke references on table "public"."invoices" from "authenticated";

revoke select on table "public"."invoices" from "authenticated";

revoke trigger on table "public"."invoices" from "authenticated";

revoke truncate on table "public"."invoices" from "authenticated";

revoke update on table "public"."invoices" from "authenticated";

revoke delete on table "public"."invoices" from "service_role";

revoke insert on table "public"."invoices" from "service_role";

revoke references on table "public"."invoices" from "service_role";

revoke select on table "public"."invoices" from "service_role";

revoke trigger on table "public"."invoices" from "service_role";

revoke truncate on table "public"."invoices" from "service_role";

revoke update on table "public"."invoices" from "service_role";

revoke delete on table "public"."invoices_stripe" from "anon";

revoke insert on table "public"."invoices_stripe" from "anon";

revoke references on table "public"."invoices_stripe" from "anon";

revoke select on table "public"."invoices_stripe" from "anon";

revoke trigger on table "public"."invoices_stripe" from "anon";

revoke truncate on table "public"."invoices_stripe" from "anon";

revoke update on table "public"."invoices_stripe" from "anon";

revoke delete on table "public"."invoices_stripe" from "authenticated";

revoke insert on table "public"."invoices_stripe" from "authenticated";

revoke references on table "public"."invoices_stripe" from "authenticated";

revoke select on table "public"."invoices_stripe" from "authenticated";

revoke trigger on table "public"."invoices_stripe" from "authenticated";

revoke truncate on table "public"."invoices_stripe" from "authenticated";

revoke update on table "public"."invoices_stripe" from "authenticated";

revoke delete on table "public"."invoices_stripe" from "service_role";

revoke insert on table "public"."invoices_stripe" from "service_role";

revoke references on table "public"."invoices_stripe" from "service_role";

revoke select on table "public"."invoices_stripe" from "service_role";

revoke trigger on table "public"."invoices_stripe" from "service_role";

revoke truncate on table "public"."invoices_stripe" from "service_role";

revoke update on table "public"."invoices_stripe" from "service_role";

revoke delete on table "public"."journal_entries" from "anon";

revoke insert on table "public"."journal_entries" from "anon";

revoke references on table "public"."journal_entries" from "anon";

revoke select on table "public"."journal_entries" from "anon";

revoke trigger on table "public"."journal_entries" from "anon";

revoke truncate on table "public"."journal_entries" from "anon";

revoke update on table "public"."journal_entries" from "anon";

revoke delete on table "public"."journal_entries" from "authenticated";

revoke insert on table "public"."journal_entries" from "authenticated";

revoke references on table "public"."journal_entries" from "authenticated";

revoke select on table "public"."journal_entries" from "authenticated";

revoke trigger on table "public"."journal_entries" from "authenticated";

revoke truncate on table "public"."journal_entries" from "authenticated";

revoke update on table "public"."journal_entries" from "authenticated";

revoke delete on table "public"."journal_entries" from "service_role";

revoke insert on table "public"."journal_entries" from "service_role";

revoke references on table "public"."journal_entries" from "service_role";

revoke select on table "public"."journal_entries" from "service_role";

revoke trigger on table "public"."journal_entries" from "service_role";

revoke truncate on table "public"."journal_entries" from "service_role";

revoke update on table "public"."journal_entries" from "service_role";

revoke delete on table "public"."journal_entry_items" from "anon";

revoke insert on table "public"."journal_entry_items" from "anon";

revoke references on table "public"."journal_entry_items" from "anon";

revoke select on table "public"."journal_entry_items" from "anon";

revoke trigger on table "public"."journal_entry_items" from "anon";

revoke truncate on table "public"."journal_entry_items" from "anon";

revoke update on table "public"."journal_entry_items" from "anon";

revoke delete on table "public"."journal_entry_items" from "authenticated";

revoke insert on table "public"."journal_entry_items" from "authenticated";

revoke references on table "public"."journal_entry_items" from "authenticated";

revoke select on table "public"."journal_entry_items" from "authenticated";

revoke trigger on table "public"."journal_entry_items" from "authenticated";

revoke truncate on table "public"."journal_entry_items" from "authenticated";

revoke update on table "public"."journal_entry_items" from "authenticated";

revoke delete on table "public"."journal_entry_items" from "service_role";

revoke insert on table "public"."journal_entry_items" from "service_role";

revoke references on table "public"."journal_entry_items" from "service_role";

revoke select on table "public"."journal_entry_items" from "service_role";

revoke trigger on table "public"."journal_entry_items" from "service_role";

revoke truncate on table "public"."journal_entry_items" from "service_role";

revoke update on table "public"."journal_entry_items" from "service_role";

revoke delete on table "public"."journal_entry_lines" from "anon";

revoke insert on table "public"."journal_entry_lines" from "anon";

revoke references on table "public"."journal_entry_lines" from "anon";

revoke select on table "public"."journal_entry_lines" from "anon";

revoke trigger on table "public"."journal_entry_lines" from "anon";

revoke truncate on table "public"."journal_entry_lines" from "anon";

revoke update on table "public"."journal_entry_lines" from "anon";

revoke delete on table "public"."journal_entry_lines" from "authenticated";

revoke insert on table "public"."journal_entry_lines" from "authenticated";

revoke references on table "public"."journal_entry_lines" from "authenticated";

revoke select on table "public"."journal_entry_lines" from "authenticated";

revoke trigger on table "public"."journal_entry_lines" from "authenticated";

revoke truncate on table "public"."journal_entry_lines" from "authenticated";

revoke update on table "public"."journal_entry_lines" from "authenticated";

revoke delete on table "public"."journal_entry_lines" from "service_role";

revoke insert on table "public"."journal_entry_lines" from "service_role";

revoke references on table "public"."journal_entry_lines" from "service_role";

revoke select on table "public"."journal_entry_lines" from "service_role";

revoke trigger on table "public"."journal_entry_lines" from "service_role";

revoke truncate on table "public"."journal_entry_lines" from "service_role";

revoke update on table "public"."journal_entry_lines" from "service_role";

revoke delete on table "public"."journals" from "anon";

revoke insert on table "public"."journals" from "anon";

revoke references on table "public"."journals" from "anon";

revoke select on table "public"."journals" from "anon";

revoke trigger on table "public"."journals" from "anon";

revoke truncate on table "public"."journals" from "anon";

revoke update on table "public"."journals" from "anon";

revoke delete on table "public"."journals" from "authenticated";

revoke insert on table "public"."journals" from "authenticated";

revoke references on table "public"."journals" from "authenticated";

revoke select on table "public"."journals" from "authenticated";

revoke trigger on table "public"."journals" from "authenticated";

revoke truncate on table "public"."journals" from "authenticated";

revoke update on table "public"."journals" from "authenticated";

revoke delete on table "public"."journals" from "service_role";

revoke insert on table "public"."journals" from "service_role";

revoke references on table "public"."journals" from "service_role";

revoke select on table "public"."journals" from "service_role";

revoke trigger on table "public"."journals" from "service_role";

revoke truncate on table "public"."journals" from "service_role";

revoke update on table "public"."journals" from "service_role";

revoke delete on table "public"."languages_catalog" from "anon";

revoke insert on table "public"."languages_catalog" from "anon";

revoke references on table "public"."languages_catalog" from "anon";

revoke select on table "public"."languages_catalog" from "anon";

revoke trigger on table "public"."languages_catalog" from "anon";

revoke truncate on table "public"."languages_catalog" from "anon";

revoke update on table "public"."languages_catalog" from "anon";

revoke delete on table "public"."languages_catalog" from "authenticated";

revoke insert on table "public"."languages_catalog" from "authenticated";

revoke references on table "public"."languages_catalog" from "authenticated";

revoke select on table "public"."languages_catalog" from "authenticated";

revoke trigger on table "public"."languages_catalog" from "authenticated";

revoke truncate on table "public"."languages_catalog" from "authenticated";

revoke update on table "public"."languages_catalog" from "authenticated";

revoke delete on table "public"."languages_catalog" from "service_role";

revoke insert on table "public"."languages_catalog" from "service_role";

revoke references on table "public"."languages_catalog" from "service_role";

revoke select on table "public"."languages_catalog" from "service_role";

revoke trigger on table "public"."languages_catalog" from "service_role";

revoke truncate on table "public"."languages_catalog" from "service_role";

revoke update on table "public"."languages_catalog" from "service_role";

revoke delete on table "public"."leave_requests" from "anon";

revoke insert on table "public"."leave_requests" from "anon";

revoke references on table "public"."leave_requests" from "anon";

revoke select on table "public"."leave_requests" from "anon";

revoke trigger on table "public"."leave_requests" from "anon";

revoke truncate on table "public"."leave_requests" from "anon";

revoke update on table "public"."leave_requests" from "anon";

revoke delete on table "public"."leave_requests" from "authenticated";

revoke insert on table "public"."leave_requests" from "authenticated";

revoke references on table "public"."leave_requests" from "authenticated";

revoke select on table "public"."leave_requests" from "authenticated";

revoke trigger on table "public"."leave_requests" from "authenticated";

revoke truncate on table "public"."leave_requests" from "authenticated";

revoke update on table "public"."leave_requests" from "authenticated";

revoke delete on table "public"."leave_requests" from "service_role";

revoke insert on table "public"."leave_requests" from "service_role";

revoke references on table "public"."leave_requests" from "service_role";

revoke select on table "public"."leave_requests" from "service_role";

revoke trigger on table "public"."leave_requests" from "service_role";

revoke truncate on table "public"."leave_requests" from "service_role";

revoke update on table "public"."leave_requests" from "service_role";

revoke delete on table "public"."leave_types" from "anon";

revoke insert on table "public"."leave_types" from "anon";

revoke references on table "public"."leave_types" from "anon";

revoke select on table "public"."leave_types" from "anon";

revoke trigger on table "public"."leave_types" from "anon";

revoke truncate on table "public"."leave_types" from "anon";

revoke update on table "public"."leave_types" from "anon";

revoke delete on table "public"."leave_types" from "authenticated";

revoke insert on table "public"."leave_types" from "authenticated";

revoke references on table "public"."leave_types" from "authenticated";

revoke select on table "public"."leave_types" from "authenticated";

revoke trigger on table "public"."leave_types" from "authenticated";

revoke truncate on table "public"."leave_types" from "authenticated";

revoke update on table "public"."leave_types" from "authenticated";

revoke delete on table "public"."leave_types" from "service_role";

revoke insert on table "public"."leave_types" from "service_role";

revoke references on table "public"."leave_types" from "service_role";

revoke select on table "public"."leave_types" from "service_role";

revoke trigger on table "public"."leave_types" from "service_role";

revoke truncate on table "public"."leave_types" from "service_role";

revoke update on table "public"."leave_types" from "service_role";

revoke delete on table "public"."legal_archives" from "anon";

revoke insert on table "public"."legal_archives" from "anon";

revoke references on table "public"."legal_archives" from "anon";

revoke select on table "public"."legal_archives" from "anon";

revoke trigger on table "public"."legal_archives" from "anon";

revoke truncate on table "public"."legal_archives" from "anon";

revoke update on table "public"."legal_archives" from "anon";

revoke delete on table "public"."legal_archives" from "authenticated";

revoke insert on table "public"."legal_archives" from "authenticated";

revoke references on table "public"."legal_archives" from "authenticated";

revoke select on table "public"."legal_archives" from "authenticated";

revoke trigger on table "public"."legal_archives" from "authenticated";

revoke truncate on table "public"."legal_archives" from "authenticated";

revoke update on table "public"."legal_archives" from "authenticated";

revoke delete on table "public"."legal_archives" from "service_role";

revoke insert on table "public"."legal_archives" from "service_role";

revoke references on table "public"."legal_archives" from "service_role";

revoke select on table "public"."legal_archives" from "service_role";

revoke trigger on table "public"."legal_archives" from "service_role";

revoke truncate on table "public"."legal_archives" from "service_role";

revoke update on table "public"."legal_archives" from "service_role";

revoke delete on table "public"."login_attempts" from "anon";

revoke insert on table "public"."login_attempts" from "anon";

revoke references on table "public"."login_attempts" from "anon";

revoke select on table "public"."login_attempts" from "anon";

revoke trigger on table "public"."login_attempts" from "anon";

revoke truncate on table "public"."login_attempts" from "anon";

revoke update on table "public"."login_attempts" from "anon";

revoke delete on table "public"."login_attempts" from "authenticated";

revoke insert on table "public"."login_attempts" from "authenticated";

revoke references on table "public"."login_attempts" from "authenticated";

revoke select on table "public"."login_attempts" from "authenticated";

revoke trigger on table "public"."login_attempts" from "authenticated";

revoke truncate on table "public"."login_attempts" from "authenticated";

revoke update on table "public"."login_attempts" from "authenticated";

revoke delete on table "public"."login_attempts" from "service_role";

revoke insert on table "public"."login_attempts" from "service_role";

revoke references on table "public"."login_attempts" from "service_role";

revoke select on table "public"."login_attempts" from "service_role";

revoke trigger on table "public"."login_attempts" from "service_role";

revoke truncate on table "public"."login_attempts" from "service_role";

revoke update on table "public"."login_attempts" from "service_role";

revoke delete on table "public"."module_catalog" from "anon";

revoke insert on table "public"."module_catalog" from "anon";

revoke references on table "public"."module_catalog" from "anon";

revoke select on table "public"."module_catalog" from "anon";

revoke trigger on table "public"."module_catalog" from "anon";

revoke truncate on table "public"."module_catalog" from "anon";

revoke update on table "public"."module_catalog" from "anon";

revoke delete on table "public"."module_catalog" from "authenticated";

revoke insert on table "public"."module_catalog" from "authenticated";

revoke references on table "public"."module_catalog" from "authenticated";

revoke select on table "public"."module_catalog" from "authenticated";

revoke trigger on table "public"."module_catalog" from "authenticated";

revoke truncate on table "public"."module_catalog" from "authenticated";

revoke update on table "public"."module_catalog" from "authenticated";

revoke delete on table "public"."module_catalog" from "service_role";

revoke insert on table "public"."module_catalog" from "service_role";

revoke references on table "public"."module_catalog" from "service_role";

revoke select on table "public"."module_catalog" from "service_role";

revoke trigger on table "public"."module_catalog" from "service_role";

revoke truncate on table "public"."module_catalog" from "service_role";

revoke update on table "public"."module_catalog" from "service_role";

revoke delete on table "public"."module_configurations" from "anon";

revoke insert on table "public"."module_configurations" from "anon";

revoke references on table "public"."module_configurations" from "anon";

revoke select on table "public"."module_configurations" from "anon";

revoke trigger on table "public"."module_configurations" from "anon";

revoke truncate on table "public"."module_configurations" from "anon";

revoke update on table "public"."module_configurations" from "anon";

revoke delete on table "public"."module_configurations" from "authenticated";

revoke insert on table "public"."module_configurations" from "authenticated";

revoke references on table "public"."module_configurations" from "authenticated";

revoke select on table "public"."module_configurations" from "authenticated";

revoke trigger on table "public"."module_configurations" from "authenticated";

revoke truncate on table "public"."module_configurations" from "authenticated";

revoke update on table "public"."module_configurations" from "authenticated";

revoke delete on table "public"."module_configurations" from "service_role";

revoke insert on table "public"."module_configurations" from "service_role";

revoke references on table "public"."module_configurations" from "service_role";

revoke select on table "public"."module_configurations" from "service_role";

revoke trigger on table "public"."module_configurations" from "service_role";

revoke truncate on table "public"."module_configurations" from "service_role";

revoke update on table "public"."module_configurations" from "service_role";

revoke delete on table "public"."notification_channels" from "anon";

revoke insert on table "public"."notification_channels" from "anon";

revoke references on table "public"."notification_channels" from "anon";

revoke select on table "public"."notification_channels" from "anon";

revoke trigger on table "public"."notification_channels" from "anon";

revoke truncate on table "public"."notification_channels" from "anon";

revoke update on table "public"."notification_channels" from "anon";

revoke delete on table "public"."notification_channels" from "authenticated";

revoke insert on table "public"."notification_channels" from "authenticated";

revoke references on table "public"."notification_channels" from "authenticated";

revoke select on table "public"."notification_channels" from "authenticated";

revoke trigger on table "public"."notification_channels" from "authenticated";

revoke truncate on table "public"."notification_channels" from "authenticated";

revoke update on table "public"."notification_channels" from "authenticated";

revoke delete on table "public"."notification_channels" from "service_role";

revoke insert on table "public"."notification_channels" from "service_role";

revoke references on table "public"."notification_channels" from "service_role";

revoke select on table "public"."notification_channels" from "service_role";

revoke trigger on table "public"."notification_channels" from "service_role";

revoke truncate on table "public"."notification_channels" from "service_role";

revoke update on table "public"."notification_channels" from "service_role";

revoke delete on table "public"."notification_history" from "anon";

revoke insert on table "public"."notification_history" from "anon";

revoke references on table "public"."notification_history" from "anon";

revoke select on table "public"."notification_history" from "anon";

revoke trigger on table "public"."notification_history" from "anon";

revoke truncate on table "public"."notification_history" from "anon";

revoke update on table "public"."notification_history" from "anon";

revoke delete on table "public"."notification_history" from "authenticated";

revoke insert on table "public"."notification_history" from "authenticated";

revoke references on table "public"."notification_history" from "authenticated";

revoke select on table "public"."notification_history" from "authenticated";

revoke trigger on table "public"."notification_history" from "authenticated";

revoke truncate on table "public"."notification_history" from "authenticated";

revoke update on table "public"."notification_history" from "authenticated";

revoke delete on table "public"."notification_history" from "service_role";

revoke insert on table "public"."notification_history" from "service_role";

revoke references on table "public"."notification_history" from "service_role";

revoke select on table "public"."notification_history" from "service_role";

revoke trigger on table "public"."notification_history" from "service_role";

revoke truncate on table "public"."notification_history" from "service_role";

revoke update on table "public"."notification_history" from "service_role";

revoke delete on table "public"."notification_preferences" from "anon";

revoke insert on table "public"."notification_preferences" from "anon";

revoke references on table "public"."notification_preferences" from "anon";

revoke select on table "public"."notification_preferences" from "anon";

revoke trigger on table "public"."notification_preferences" from "anon";

revoke truncate on table "public"."notification_preferences" from "anon";

revoke update on table "public"."notification_preferences" from "anon";

revoke delete on table "public"."notification_preferences" from "authenticated";

revoke insert on table "public"."notification_preferences" from "authenticated";

revoke references on table "public"."notification_preferences" from "authenticated";

revoke select on table "public"."notification_preferences" from "authenticated";

revoke trigger on table "public"."notification_preferences" from "authenticated";

revoke truncate on table "public"."notification_preferences" from "authenticated";

revoke update on table "public"."notification_preferences" from "authenticated";

revoke delete on table "public"."notification_preferences" from "service_role";

revoke insert on table "public"."notification_preferences" from "service_role";

revoke references on table "public"."notification_preferences" from "service_role";

revoke select on table "public"."notification_preferences" from "service_role";

revoke trigger on table "public"."notification_preferences" from "service_role";

revoke truncate on table "public"."notification_preferences" from "service_role";

revoke update on table "public"."notification_preferences" from "service_role";

revoke delete on table "public"."notification_templates" from "anon";

revoke insert on table "public"."notification_templates" from "anon";

revoke references on table "public"."notification_templates" from "anon";

revoke select on table "public"."notification_templates" from "anon";

revoke trigger on table "public"."notification_templates" from "anon";

revoke truncate on table "public"."notification_templates" from "anon";

revoke update on table "public"."notification_templates" from "anon";

revoke delete on table "public"."notification_templates" from "authenticated";

revoke insert on table "public"."notification_templates" from "authenticated";

revoke references on table "public"."notification_templates" from "authenticated";

revoke select on table "public"."notification_templates" from "authenticated";

revoke trigger on table "public"."notification_templates" from "authenticated";

revoke truncate on table "public"."notification_templates" from "authenticated";

revoke update on table "public"."notification_templates" from "authenticated";

revoke delete on table "public"."notification_templates" from "service_role";

revoke insert on table "public"."notification_templates" from "service_role";

revoke references on table "public"."notification_templates" from "service_role";

revoke select on table "public"."notification_templates" from "service_role";

revoke trigger on table "public"."notification_templates" from "service_role";

revoke truncate on table "public"."notification_templates" from "service_role";

revoke update on table "public"."notification_templates" from "service_role";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke delete on table "public"."notifications" from "authenticated";

revoke insert on table "public"."notifications" from "authenticated";

revoke references on table "public"."notifications" from "authenticated";

revoke select on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke update on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

revoke delete on table "public"."oauth_providers" from "anon";

revoke insert on table "public"."oauth_providers" from "anon";

revoke references on table "public"."oauth_providers" from "anon";

revoke select on table "public"."oauth_providers" from "anon";

revoke trigger on table "public"."oauth_providers" from "anon";

revoke truncate on table "public"."oauth_providers" from "anon";

revoke update on table "public"."oauth_providers" from "anon";

revoke delete on table "public"."oauth_providers" from "authenticated";

revoke insert on table "public"."oauth_providers" from "authenticated";

revoke references on table "public"."oauth_providers" from "authenticated";

revoke select on table "public"."oauth_providers" from "authenticated";

revoke trigger on table "public"."oauth_providers" from "authenticated";

revoke truncate on table "public"."oauth_providers" from "authenticated";

revoke update on table "public"."oauth_providers" from "authenticated";

revoke delete on table "public"."oauth_providers" from "service_role";

revoke insert on table "public"."oauth_providers" from "service_role";

revoke references on table "public"."oauth_providers" from "service_role";

revoke select on table "public"."oauth_providers" from "service_role";

revoke trigger on table "public"."oauth_providers" from "service_role";

revoke truncate on table "public"."oauth_providers" from "service_role";

revoke update on table "public"."oauth_providers" from "service_role";

revoke delete on table "public"."onboarding_history" from "anon";

revoke insert on table "public"."onboarding_history" from "anon";

revoke references on table "public"."onboarding_history" from "anon";

revoke select on table "public"."onboarding_history" from "anon";

revoke trigger on table "public"."onboarding_history" from "anon";

revoke truncate on table "public"."onboarding_history" from "anon";

revoke update on table "public"."onboarding_history" from "anon";

revoke delete on table "public"."onboarding_history" from "authenticated";

revoke insert on table "public"."onboarding_history" from "authenticated";

revoke references on table "public"."onboarding_history" from "authenticated";

revoke select on table "public"."onboarding_history" from "authenticated";

revoke trigger on table "public"."onboarding_history" from "authenticated";

revoke truncate on table "public"."onboarding_history" from "authenticated";

revoke update on table "public"."onboarding_history" from "authenticated";

revoke delete on table "public"."onboarding_history" from "service_role";

revoke insert on table "public"."onboarding_history" from "service_role";

revoke references on table "public"."onboarding_history" from "service_role";

revoke select on table "public"."onboarding_history" from "service_role";

revoke trigger on table "public"."onboarding_history" from "service_role";

revoke truncate on table "public"."onboarding_history" from "service_role";

revoke update on table "public"."onboarding_history" from "service_role";

revoke delete on table "public"."onboarding_sessions" from "anon";

revoke insert on table "public"."onboarding_sessions" from "anon";

revoke references on table "public"."onboarding_sessions" from "anon";

revoke select on table "public"."onboarding_sessions" from "anon";

revoke trigger on table "public"."onboarding_sessions" from "anon";

revoke truncate on table "public"."onboarding_sessions" from "anon";

revoke update on table "public"."onboarding_sessions" from "anon";

revoke delete on table "public"."onboarding_sessions" from "authenticated";

revoke insert on table "public"."onboarding_sessions" from "authenticated";

revoke references on table "public"."onboarding_sessions" from "authenticated";

revoke select on table "public"."onboarding_sessions" from "authenticated";

revoke trigger on table "public"."onboarding_sessions" from "authenticated";

revoke truncate on table "public"."onboarding_sessions" from "authenticated";

revoke update on table "public"."onboarding_sessions" from "authenticated";

revoke delete on table "public"."onboarding_sessions" from "service_role";

revoke insert on table "public"."onboarding_sessions" from "service_role";

revoke references on table "public"."onboarding_sessions" from "service_role";

revoke select on table "public"."onboarding_sessions" from "service_role";

revoke trigger on table "public"."onboarding_sessions" from "service_role";

revoke truncate on table "public"."onboarding_sessions" from "service_role";

revoke update on table "public"."onboarding_sessions" from "service_role";

revoke delete on table "public"."password_policies" from "anon";

revoke insert on table "public"."password_policies" from "anon";

revoke references on table "public"."password_policies" from "anon";

revoke select on table "public"."password_policies" from "anon";

revoke trigger on table "public"."password_policies" from "anon";

revoke truncate on table "public"."password_policies" from "anon";

revoke update on table "public"."password_policies" from "anon";

revoke delete on table "public"."password_policies" from "authenticated";

revoke insert on table "public"."password_policies" from "authenticated";

revoke references on table "public"."password_policies" from "authenticated";

revoke select on table "public"."password_policies" from "authenticated";

revoke trigger on table "public"."password_policies" from "authenticated";

revoke truncate on table "public"."password_policies" from "authenticated";

revoke update on table "public"."password_policies" from "authenticated";

revoke delete on table "public"."password_policies" from "service_role";

revoke insert on table "public"."password_policies" from "service_role";

revoke references on table "public"."password_policies" from "service_role";

revoke select on table "public"."password_policies" from "service_role";

revoke trigger on table "public"."password_policies" from "service_role";

revoke truncate on table "public"."password_policies" from "service_role";

revoke update on table "public"."password_policies" from "service_role";

revoke delete on table "public"."payment_methods" from "anon";

revoke insert on table "public"."payment_methods" from "anon";

revoke references on table "public"."payment_methods" from "anon";

revoke select on table "public"."payment_methods" from "anon";

revoke trigger on table "public"."payment_methods" from "anon";

revoke truncate on table "public"."payment_methods" from "anon";

revoke update on table "public"."payment_methods" from "anon";

revoke delete on table "public"."payment_methods" from "authenticated";

revoke insert on table "public"."payment_methods" from "authenticated";

revoke references on table "public"."payment_methods" from "authenticated";

revoke select on table "public"."payment_methods" from "authenticated";

revoke trigger on table "public"."payment_methods" from "authenticated";

revoke truncate on table "public"."payment_methods" from "authenticated";

revoke update on table "public"."payment_methods" from "authenticated";

revoke delete on table "public"."payment_methods" from "service_role";

revoke insert on table "public"."payment_methods" from "service_role";

revoke references on table "public"."payment_methods" from "service_role";

revoke select on table "public"."payment_methods" from "service_role";

revoke trigger on table "public"."payment_methods" from "service_role";

revoke truncate on table "public"."payment_methods" from "service_role";

revoke update on table "public"."payment_methods" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke references on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke trigger on table "public"."payments" from "anon";

revoke truncate on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke references on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke trigger on table "public"."payments" from "authenticated";

revoke truncate on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke references on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke trigger on table "public"."payments" from "service_role";

revoke truncate on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."payroll" from "anon";

revoke insert on table "public"."payroll" from "anon";

revoke references on table "public"."payroll" from "anon";

revoke select on table "public"."payroll" from "anon";

revoke trigger on table "public"."payroll" from "anon";

revoke truncate on table "public"."payroll" from "anon";

revoke update on table "public"."payroll" from "anon";

revoke delete on table "public"."payroll" from "authenticated";

revoke insert on table "public"."payroll" from "authenticated";

revoke references on table "public"."payroll" from "authenticated";

revoke select on table "public"."payroll" from "authenticated";

revoke trigger on table "public"."payroll" from "authenticated";

revoke truncate on table "public"."payroll" from "authenticated";

revoke update on table "public"."payroll" from "authenticated";

revoke delete on table "public"."payroll" from "service_role";

revoke insert on table "public"."payroll" from "service_role";

revoke references on table "public"."payroll" from "service_role";

revoke select on table "public"."payroll" from "service_role";

revoke trigger on table "public"."payroll" from "service_role";

revoke truncate on table "public"."payroll" from "service_role";

revoke update on table "public"."payroll" from "service_role";

revoke delete on table "public"."payroll_items" from "anon";

revoke insert on table "public"."payroll_items" from "anon";

revoke references on table "public"."payroll_items" from "anon";

revoke select on table "public"."payroll_items" from "anon";

revoke trigger on table "public"."payroll_items" from "anon";

revoke truncate on table "public"."payroll_items" from "anon";

revoke update on table "public"."payroll_items" from "anon";

revoke delete on table "public"."payroll_items" from "authenticated";

revoke insert on table "public"."payroll_items" from "authenticated";

revoke references on table "public"."payroll_items" from "authenticated";

revoke select on table "public"."payroll_items" from "authenticated";

revoke trigger on table "public"."payroll_items" from "authenticated";

revoke truncate on table "public"."payroll_items" from "authenticated";

revoke update on table "public"."payroll_items" from "authenticated";

revoke delete on table "public"."payroll_items" from "service_role";

revoke insert on table "public"."payroll_items" from "service_role";

revoke references on table "public"."payroll_items" from "service_role";

revoke select on table "public"."payroll_items" from "service_role";

revoke trigger on table "public"."payroll_items" from "service_role";

revoke truncate on table "public"."payroll_items" from "service_role";

revoke update on table "public"."payroll_items" from "service_role";

revoke delete on table "public"."performance_reviews" from "anon";

revoke insert on table "public"."performance_reviews" from "anon";

revoke references on table "public"."performance_reviews" from "anon";

revoke select on table "public"."performance_reviews" from "anon";

revoke trigger on table "public"."performance_reviews" from "anon";

revoke truncate on table "public"."performance_reviews" from "anon";

revoke update on table "public"."performance_reviews" from "anon";

revoke delete on table "public"."performance_reviews" from "authenticated";

revoke insert on table "public"."performance_reviews" from "authenticated";

revoke references on table "public"."performance_reviews" from "authenticated";

revoke select on table "public"."performance_reviews" from "authenticated";

revoke trigger on table "public"."performance_reviews" from "authenticated";

revoke truncate on table "public"."performance_reviews" from "authenticated";

revoke update on table "public"."performance_reviews" from "authenticated";

revoke delete on table "public"."performance_reviews" from "service_role";

revoke insert on table "public"."performance_reviews" from "service_role";

revoke references on table "public"."performance_reviews" from "service_role";

revoke select on table "public"."performance_reviews" from "service_role";

revoke trigger on table "public"."performance_reviews" from "service_role";

revoke truncate on table "public"."performance_reviews" from "service_role";

revoke update on table "public"."performance_reviews" from "service_role";

revoke delete on table "public"."performance_settings" from "anon";

revoke insert on table "public"."performance_settings" from "anon";

revoke references on table "public"."performance_settings" from "anon";

revoke select on table "public"."performance_settings" from "anon";

revoke trigger on table "public"."performance_settings" from "anon";

revoke truncate on table "public"."performance_settings" from "anon";

revoke update on table "public"."performance_settings" from "anon";

revoke delete on table "public"."performance_settings" from "authenticated";

revoke insert on table "public"."performance_settings" from "authenticated";

revoke references on table "public"."performance_settings" from "authenticated";

revoke select on table "public"."performance_settings" from "authenticated";

revoke trigger on table "public"."performance_settings" from "authenticated";

revoke truncate on table "public"."performance_settings" from "authenticated";

revoke update on table "public"."performance_settings" from "authenticated";

revoke delete on table "public"."performance_settings" from "service_role";

revoke insert on table "public"."performance_settings" from "service_role";

revoke references on table "public"."performance_settings" from "service_role";

revoke select on table "public"."performance_settings" from "service_role";

revoke trigger on table "public"."performance_settings" from "service_role";

revoke truncate on table "public"."performance_settings" from "service_role";

revoke update on table "public"."performance_settings" from "service_role";

revoke delete on table "public"."permissions" from "anon";

revoke insert on table "public"."permissions" from "anon";

revoke references on table "public"."permissions" from "anon";

revoke select on table "public"."permissions" from "anon";

revoke trigger on table "public"."permissions" from "anon";

revoke truncate on table "public"."permissions" from "anon";

revoke update on table "public"."permissions" from "anon";

revoke delete on table "public"."permissions" from "authenticated";

revoke insert on table "public"."permissions" from "authenticated";

revoke references on table "public"."permissions" from "authenticated";

revoke select on table "public"."permissions" from "authenticated";

revoke trigger on table "public"."permissions" from "authenticated";

revoke truncate on table "public"."permissions" from "authenticated";

revoke update on table "public"."permissions" from "authenticated";

revoke delete on table "public"."permissions" from "service_role";

revoke insert on table "public"."permissions" from "service_role";

revoke references on table "public"."permissions" from "service_role";

revoke select on table "public"."permissions" from "service_role";

revoke trigger on table "public"."permissions" from "service_role";

revoke truncate on table "public"."permissions" from "service_role";

revoke update on table "public"."permissions" from "service_role";

revoke delete on table "public"."positions" from "anon";

revoke insert on table "public"."positions" from "anon";

revoke references on table "public"."positions" from "anon";

revoke select on table "public"."positions" from "anon";

revoke trigger on table "public"."positions" from "anon";

revoke truncate on table "public"."positions" from "anon";

revoke update on table "public"."positions" from "anon";

revoke delete on table "public"."positions" from "authenticated";

revoke insert on table "public"."positions" from "authenticated";

revoke references on table "public"."positions" from "authenticated";

revoke select on table "public"."positions" from "authenticated";

revoke trigger on table "public"."positions" from "authenticated";

revoke truncate on table "public"."positions" from "authenticated";

revoke update on table "public"."positions" from "authenticated";

revoke delete on table "public"."positions" from "service_role";

revoke insert on table "public"."positions" from "service_role";

revoke references on table "public"."positions" from "service_role";

revoke select on table "public"."positions" from "service_role";

revoke trigger on table "public"."positions" from "service_role";

revoke truncate on table "public"."positions" from "service_role";

revoke update on table "public"."positions" from "service_role";

revoke delete on table "public"."product_categories" from "anon";

revoke insert on table "public"."product_categories" from "anon";

revoke references on table "public"."product_categories" from "anon";

revoke select on table "public"."product_categories" from "anon";

revoke trigger on table "public"."product_categories" from "anon";

revoke truncate on table "public"."product_categories" from "anon";

revoke update on table "public"."product_categories" from "anon";

revoke delete on table "public"."product_categories" from "authenticated";

revoke insert on table "public"."product_categories" from "authenticated";

revoke references on table "public"."product_categories" from "authenticated";

revoke select on table "public"."product_categories" from "authenticated";

revoke trigger on table "public"."product_categories" from "authenticated";

revoke truncate on table "public"."product_categories" from "authenticated";

revoke update on table "public"."product_categories" from "authenticated";

revoke delete on table "public"."product_categories" from "service_role";

revoke insert on table "public"."product_categories" from "service_role";

revoke references on table "public"."product_categories" from "service_role";

revoke select on table "public"."product_categories" from "service_role";

revoke trigger on table "public"."product_categories" from "service_role";

revoke truncate on table "public"."product_categories" from "service_role";

revoke update on table "public"."product_categories" from "service_role";

revoke delete on table "public"."product_variants" from "anon";

revoke insert on table "public"."product_variants" from "anon";

revoke references on table "public"."product_variants" from "anon";

revoke select on table "public"."product_variants" from "anon";

revoke trigger on table "public"."product_variants" from "anon";

revoke truncate on table "public"."product_variants" from "anon";

revoke update on table "public"."product_variants" from "anon";

revoke delete on table "public"."product_variants" from "authenticated";

revoke insert on table "public"."product_variants" from "authenticated";

revoke references on table "public"."product_variants" from "authenticated";

revoke select on table "public"."product_variants" from "authenticated";

revoke trigger on table "public"."product_variants" from "authenticated";

revoke truncate on table "public"."product_variants" from "authenticated";

revoke update on table "public"."product_variants" from "authenticated";

revoke delete on table "public"."product_variants" from "service_role";

revoke insert on table "public"."product_variants" from "service_role";

revoke references on table "public"."product_variants" from "service_role";

revoke select on table "public"."product_variants" from "service_role";

revoke trigger on table "public"."product_variants" from "service_role";

revoke truncate on table "public"."product_variants" from "service_role";

revoke update on table "public"."product_variants" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke select on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."project_baselines" from "anon";

revoke insert on table "public"."project_baselines" from "anon";

revoke references on table "public"."project_baselines" from "anon";

revoke select on table "public"."project_baselines" from "anon";

revoke trigger on table "public"."project_baselines" from "anon";

revoke truncate on table "public"."project_baselines" from "anon";

revoke update on table "public"."project_baselines" from "anon";

revoke delete on table "public"."project_baselines" from "authenticated";

revoke insert on table "public"."project_baselines" from "authenticated";

revoke references on table "public"."project_baselines" from "authenticated";

revoke select on table "public"."project_baselines" from "authenticated";

revoke trigger on table "public"."project_baselines" from "authenticated";

revoke truncate on table "public"."project_baselines" from "authenticated";

revoke update on table "public"."project_baselines" from "authenticated";

revoke delete on table "public"."project_baselines" from "service_role";

revoke insert on table "public"."project_baselines" from "service_role";

revoke references on table "public"."project_baselines" from "service_role";

revoke select on table "public"."project_baselines" from "service_role";

revoke trigger on table "public"."project_baselines" from "service_role";

revoke truncate on table "public"."project_baselines" from "service_role";

revoke update on table "public"."project_baselines" from "service_role";

revoke delete on table "public"."project_billing_rates" from "anon";

revoke insert on table "public"."project_billing_rates" from "anon";

revoke references on table "public"."project_billing_rates" from "anon";

revoke select on table "public"."project_billing_rates" from "anon";

revoke trigger on table "public"."project_billing_rates" from "anon";

revoke truncate on table "public"."project_billing_rates" from "anon";

revoke update on table "public"."project_billing_rates" from "anon";

revoke delete on table "public"."project_billing_rates" from "authenticated";

revoke insert on table "public"."project_billing_rates" from "authenticated";

revoke references on table "public"."project_billing_rates" from "authenticated";

revoke select on table "public"."project_billing_rates" from "authenticated";

revoke trigger on table "public"."project_billing_rates" from "authenticated";

revoke truncate on table "public"."project_billing_rates" from "authenticated";

revoke update on table "public"."project_billing_rates" from "authenticated";

revoke delete on table "public"."project_billing_rates" from "service_role";

revoke insert on table "public"."project_billing_rates" from "service_role";

revoke references on table "public"."project_billing_rates" from "service_role";

revoke select on table "public"."project_billing_rates" from "service_role";

revoke trigger on table "public"."project_billing_rates" from "service_role";

revoke truncate on table "public"."project_billing_rates" from "service_role";

revoke update on table "public"."project_billing_rates" from "service_role";

revoke delete on table "public"."project_budgets" from "anon";

revoke insert on table "public"."project_budgets" from "anon";

revoke references on table "public"."project_budgets" from "anon";

revoke select on table "public"."project_budgets" from "anon";

revoke trigger on table "public"."project_budgets" from "anon";

revoke truncate on table "public"."project_budgets" from "anon";

revoke update on table "public"."project_budgets" from "anon";

revoke delete on table "public"."project_budgets" from "authenticated";

revoke insert on table "public"."project_budgets" from "authenticated";

revoke references on table "public"."project_budgets" from "authenticated";

revoke select on table "public"."project_budgets" from "authenticated";

revoke trigger on table "public"."project_budgets" from "authenticated";

revoke truncate on table "public"."project_budgets" from "authenticated";

revoke update on table "public"."project_budgets" from "authenticated";

revoke delete on table "public"."project_budgets" from "service_role";

revoke insert on table "public"."project_budgets" from "service_role";

revoke references on table "public"."project_budgets" from "service_role";

revoke select on table "public"."project_budgets" from "service_role";

revoke trigger on table "public"."project_budgets" from "service_role";

revoke truncate on table "public"."project_budgets" from "service_role";

revoke update on table "public"."project_budgets" from "service_role";

revoke delete on table "public"."project_categories" from "anon";

revoke insert on table "public"."project_categories" from "anon";

revoke references on table "public"."project_categories" from "anon";

revoke select on table "public"."project_categories" from "anon";

revoke trigger on table "public"."project_categories" from "anon";

revoke truncate on table "public"."project_categories" from "anon";

revoke update on table "public"."project_categories" from "anon";

revoke delete on table "public"."project_categories" from "authenticated";

revoke insert on table "public"."project_categories" from "authenticated";

revoke references on table "public"."project_categories" from "authenticated";

revoke select on table "public"."project_categories" from "authenticated";

revoke trigger on table "public"."project_categories" from "authenticated";

revoke truncate on table "public"."project_categories" from "authenticated";

revoke update on table "public"."project_categories" from "authenticated";

revoke delete on table "public"."project_categories" from "service_role";

revoke insert on table "public"."project_categories" from "service_role";

revoke references on table "public"."project_categories" from "service_role";

revoke select on table "public"."project_categories" from "service_role";

revoke trigger on table "public"."project_categories" from "service_role";

revoke truncate on table "public"."project_categories" from "service_role";

revoke update on table "public"."project_categories" from "service_role";

revoke delete on table "public"."project_discussions" from "anon";

revoke insert on table "public"."project_discussions" from "anon";

revoke references on table "public"."project_discussions" from "anon";

revoke select on table "public"."project_discussions" from "anon";

revoke trigger on table "public"."project_discussions" from "anon";

revoke truncate on table "public"."project_discussions" from "anon";

revoke update on table "public"."project_discussions" from "anon";

revoke delete on table "public"."project_discussions" from "authenticated";

revoke insert on table "public"."project_discussions" from "authenticated";

revoke references on table "public"."project_discussions" from "authenticated";

revoke select on table "public"."project_discussions" from "authenticated";

revoke trigger on table "public"."project_discussions" from "authenticated";

revoke truncate on table "public"."project_discussions" from "authenticated";

revoke update on table "public"."project_discussions" from "authenticated";

revoke delete on table "public"."project_discussions" from "service_role";

revoke insert on table "public"."project_discussions" from "service_role";

revoke references on table "public"."project_discussions" from "service_role";

revoke select on table "public"."project_discussions" from "service_role";

revoke trigger on table "public"."project_discussions" from "service_role";

revoke truncate on table "public"."project_discussions" from "service_role";

revoke update on table "public"."project_discussions" from "service_role";

revoke delete on table "public"."project_expenses" from "anon";

revoke insert on table "public"."project_expenses" from "anon";

revoke references on table "public"."project_expenses" from "anon";

revoke select on table "public"."project_expenses" from "anon";

revoke trigger on table "public"."project_expenses" from "anon";

revoke truncate on table "public"."project_expenses" from "anon";

revoke update on table "public"."project_expenses" from "anon";

revoke delete on table "public"."project_expenses" from "authenticated";

revoke insert on table "public"."project_expenses" from "authenticated";

revoke references on table "public"."project_expenses" from "authenticated";

revoke select on table "public"."project_expenses" from "authenticated";

revoke trigger on table "public"."project_expenses" from "authenticated";

revoke truncate on table "public"."project_expenses" from "authenticated";

revoke update on table "public"."project_expenses" from "authenticated";

revoke delete on table "public"."project_expenses" from "service_role";

revoke insert on table "public"."project_expenses" from "service_role";

revoke references on table "public"."project_expenses" from "service_role";

revoke select on table "public"."project_expenses" from "service_role";

revoke trigger on table "public"."project_expenses" from "service_role";

revoke truncate on table "public"."project_expenses" from "service_role";

revoke update on table "public"."project_expenses" from "service_role";

revoke delete on table "public"."project_forecasts" from "anon";

revoke insert on table "public"."project_forecasts" from "anon";

revoke references on table "public"."project_forecasts" from "anon";

revoke select on table "public"."project_forecasts" from "anon";

revoke trigger on table "public"."project_forecasts" from "anon";

revoke truncate on table "public"."project_forecasts" from "anon";

revoke update on table "public"."project_forecasts" from "anon";

revoke delete on table "public"."project_forecasts" from "authenticated";

revoke insert on table "public"."project_forecasts" from "authenticated";

revoke references on table "public"."project_forecasts" from "authenticated";

revoke select on table "public"."project_forecasts" from "authenticated";

revoke trigger on table "public"."project_forecasts" from "authenticated";

revoke truncate on table "public"."project_forecasts" from "authenticated";

revoke update on table "public"."project_forecasts" from "authenticated";

revoke delete on table "public"."project_forecasts" from "service_role";

revoke insert on table "public"."project_forecasts" from "service_role";

revoke references on table "public"."project_forecasts" from "service_role";

revoke select on table "public"."project_forecasts" from "service_role";

revoke trigger on table "public"."project_forecasts" from "service_role";

revoke truncate on table "public"."project_forecasts" from "service_role";

revoke update on table "public"."project_forecasts" from "service_role";

revoke delete on table "public"."project_gantt_data" from "anon";

revoke insert on table "public"."project_gantt_data" from "anon";

revoke references on table "public"."project_gantt_data" from "anon";

revoke select on table "public"."project_gantt_data" from "anon";

revoke trigger on table "public"."project_gantt_data" from "anon";

revoke truncate on table "public"."project_gantt_data" from "anon";

revoke update on table "public"."project_gantt_data" from "anon";

revoke delete on table "public"."project_gantt_data" from "authenticated";

revoke insert on table "public"."project_gantt_data" from "authenticated";

revoke references on table "public"."project_gantt_data" from "authenticated";

revoke select on table "public"."project_gantt_data" from "authenticated";

revoke trigger on table "public"."project_gantt_data" from "authenticated";

revoke truncate on table "public"."project_gantt_data" from "authenticated";

revoke update on table "public"."project_gantt_data" from "authenticated";

revoke delete on table "public"."project_gantt_data" from "service_role";

revoke insert on table "public"."project_gantt_data" from "service_role";

revoke references on table "public"."project_gantt_data" from "service_role";

revoke select on table "public"."project_gantt_data" from "service_role";

revoke trigger on table "public"."project_gantt_data" from "service_role";

revoke truncate on table "public"."project_gantt_data" from "service_role";

revoke update on table "public"."project_gantt_data" from "service_role";

revoke delete on table "public"."project_kpis" from "anon";

revoke insert on table "public"."project_kpis" from "anon";

revoke references on table "public"."project_kpis" from "anon";

revoke select on table "public"."project_kpis" from "anon";

revoke trigger on table "public"."project_kpis" from "anon";

revoke truncate on table "public"."project_kpis" from "anon";

revoke update on table "public"."project_kpis" from "anon";

revoke delete on table "public"."project_kpis" from "authenticated";

revoke insert on table "public"."project_kpis" from "authenticated";

revoke references on table "public"."project_kpis" from "authenticated";

revoke select on table "public"."project_kpis" from "authenticated";

revoke trigger on table "public"."project_kpis" from "authenticated";

revoke truncate on table "public"."project_kpis" from "authenticated";

revoke update on table "public"."project_kpis" from "authenticated";

revoke delete on table "public"."project_kpis" from "service_role";

revoke insert on table "public"."project_kpis" from "service_role";

revoke references on table "public"."project_kpis" from "service_role";

revoke select on table "public"."project_kpis" from "service_role";

revoke trigger on table "public"."project_kpis" from "service_role";

revoke truncate on table "public"."project_kpis" from "service_role";

revoke update on table "public"."project_kpis" from "service_role";

revoke delete on table "public"."project_members" from "anon";

revoke insert on table "public"."project_members" from "anon";

revoke references on table "public"."project_members" from "anon";

revoke select on table "public"."project_members" from "anon";

revoke trigger on table "public"."project_members" from "anon";

revoke truncate on table "public"."project_members" from "anon";

revoke update on table "public"."project_members" from "anon";

revoke delete on table "public"."project_members" from "authenticated";

revoke insert on table "public"."project_members" from "authenticated";

revoke references on table "public"."project_members" from "authenticated";

revoke select on table "public"."project_members" from "authenticated";

revoke trigger on table "public"."project_members" from "authenticated";

revoke truncate on table "public"."project_members" from "authenticated";

revoke update on table "public"."project_members" from "authenticated";

revoke delete on table "public"."project_members" from "service_role";

revoke insert on table "public"."project_members" from "service_role";

revoke references on table "public"."project_members" from "service_role";

revoke select on table "public"."project_members" from "service_role";

revoke trigger on table "public"."project_members" from "service_role";

revoke truncate on table "public"."project_members" from "service_role";

revoke update on table "public"."project_members" from "service_role";

revoke delete on table "public"."project_milestones" from "anon";

revoke insert on table "public"."project_milestones" from "anon";

revoke references on table "public"."project_milestones" from "anon";

revoke select on table "public"."project_milestones" from "anon";

revoke trigger on table "public"."project_milestones" from "anon";

revoke truncate on table "public"."project_milestones" from "anon";

revoke update on table "public"."project_milestones" from "anon";

revoke delete on table "public"."project_milestones" from "authenticated";

revoke insert on table "public"."project_milestones" from "authenticated";

revoke references on table "public"."project_milestones" from "authenticated";

revoke select on table "public"."project_milestones" from "authenticated";

revoke trigger on table "public"."project_milestones" from "authenticated";

revoke truncate on table "public"."project_milestones" from "authenticated";

revoke update on table "public"."project_milestones" from "authenticated";

revoke delete on table "public"."project_milestones" from "service_role";

revoke insert on table "public"."project_milestones" from "service_role";

revoke references on table "public"."project_milestones" from "service_role";

revoke select on table "public"."project_milestones" from "service_role";

revoke trigger on table "public"."project_milestones" from "service_role";

revoke truncate on table "public"."project_milestones" from "service_role";

revoke update on table "public"."project_milestones" from "service_role";

revoke delete on table "public"."project_notifications" from "anon";

revoke insert on table "public"."project_notifications" from "anon";

revoke references on table "public"."project_notifications" from "anon";

revoke select on table "public"."project_notifications" from "anon";

revoke trigger on table "public"."project_notifications" from "anon";

revoke truncate on table "public"."project_notifications" from "anon";

revoke update on table "public"."project_notifications" from "anon";

revoke delete on table "public"."project_notifications" from "authenticated";

revoke insert on table "public"."project_notifications" from "authenticated";

revoke references on table "public"."project_notifications" from "authenticated";

revoke select on table "public"."project_notifications" from "authenticated";

revoke trigger on table "public"."project_notifications" from "authenticated";

revoke truncate on table "public"."project_notifications" from "authenticated";

revoke update on table "public"."project_notifications" from "authenticated";

revoke delete on table "public"."project_notifications" from "service_role";

revoke insert on table "public"."project_notifications" from "service_role";

revoke references on table "public"."project_notifications" from "service_role";

revoke select on table "public"."project_notifications" from "service_role";

revoke trigger on table "public"."project_notifications" from "service_role";

revoke truncate on table "public"."project_notifications" from "service_role";

revoke update on table "public"."project_notifications" from "service_role";

revoke delete on table "public"."project_phases" from "anon";

revoke insert on table "public"."project_phases" from "anon";

revoke references on table "public"."project_phases" from "anon";

revoke select on table "public"."project_phases" from "anon";

revoke trigger on table "public"."project_phases" from "anon";

revoke truncate on table "public"."project_phases" from "anon";

revoke update on table "public"."project_phases" from "anon";

revoke delete on table "public"."project_phases" from "authenticated";

revoke insert on table "public"."project_phases" from "authenticated";

revoke references on table "public"."project_phases" from "authenticated";

revoke select on table "public"."project_phases" from "authenticated";

revoke trigger on table "public"."project_phases" from "authenticated";

revoke truncate on table "public"."project_phases" from "authenticated";

revoke update on table "public"."project_phases" from "authenticated";

revoke delete on table "public"."project_phases" from "service_role";

revoke insert on table "public"."project_phases" from "service_role";

revoke references on table "public"."project_phases" from "service_role";

revoke select on table "public"."project_phases" from "service_role";

revoke trigger on table "public"."project_phases" from "service_role";

revoke truncate on table "public"."project_phases" from "service_role";

revoke update on table "public"."project_phases" from "service_role";

revoke delete on table "public"."project_resources" from "anon";

revoke insert on table "public"."project_resources" from "anon";

revoke references on table "public"."project_resources" from "anon";

revoke select on table "public"."project_resources" from "anon";

revoke trigger on table "public"."project_resources" from "anon";

revoke truncate on table "public"."project_resources" from "anon";

revoke update on table "public"."project_resources" from "anon";

revoke delete on table "public"."project_resources" from "authenticated";

revoke insert on table "public"."project_resources" from "authenticated";

revoke references on table "public"."project_resources" from "authenticated";

revoke select on table "public"."project_resources" from "authenticated";

revoke trigger on table "public"."project_resources" from "authenticated";

revoke truncate on table "public"."project_resources" from "authenticated";

revoke update on table "public"."project_resources" from "authenticated";

revoke delete on table "public"."project_resources" from "service_role";

revoke insert on table "public"."project_resources" from "service_role";

revoke references on table "public"."project_resources" from "service_role";

revoke select on table "public"."project_resources" from "service_role";

revoke trigger on table "public"."project_resources" from "service_role";

revoke truncate on table "public"."project_resources" from "service_role";

revoke update on table "public"."project_resources" from "service_role";

revoke delete on table "public"."project_roles" from "anon";

revoke insert on table "public"."project_roles" from "anon";

revoke references on table "public"."project_roles" from "anon";

revoke select on table "public"."project_roles" from "anon";

revoke trigger on table "public"."project_roles" from "anon";

revoke truncate on table "public"."project_roles" from "anon";

revoke update on table "public"."project_roles" from "anon";

revoke delete on table "public"."project_roles" from "authenticated";

revoke insert on table "public"."project_roles" from "authenticated";

revoke references on table "public"."project_roles" from "authenticated";

revoke select on table "public"."project_roles" from "authenticated";

revoke trigger on table "public"."project_roles" from "authenticated";

revoke truncate on table "public"."project_roles" from "authenticated";

revoke update on table "public"."project_roles" from "authenticated";

revoke delete on table "public"."project_roles" from "service_role";

revoke insert on table "public"."project_roles" from "service_role";

revoke references on table "public"."project_roles" from "service_role";

revoke select on table "public"."project_roles" from "service_role";

revoke trigger on table "public"."project_roles" from "service_role";

revoke truncate on table "public"."project_roles" from "service_role";

revoke update on table "public"."project_roles" from "service_role";

revoke delete on table "public"."project_schedules" from "anon";

revoke insert on table "public"."project_schedules" from "anon";

revoke references on table "public"."project_schedules" from "anon";

revoke select on table "public"."project_schedules" from "anon";

revoke trigger on table "public"."project_schedules" from "anon";

revoke truncate on table "public"."project_schedules" from "anon";

revoke update on table "public"."project_schedules" from "anon";

revoke delete on table "public"."project_schedules" from "authenticated";

revoke insert on table "public"."project_schedules" from "authenticated";

revoke references on table "public"."project_schedules" from "authenticated";

revoke select on table "public"."project_schedules" from "authenticated";

revoke trigger on table "public"."project_schedules" from "authenticated";

revoke truncate on table "public"."project_schedules" from "authenticated";

revoke update on table "public"."project_schedules" from "authenticated";

revoke delete on table "public"."project_schedules" from "service_role";

revoke insert on table "public"."project_schedules" from "service_role";

revoke references on table "public"."project_schedules" from "service_role";

revoke select on table "public"."project_schedules" from "service_role";

revoke trigger on table "public"."project_schedules" from "service_role";

revoke truncate on table "public"."project_schedules" from "service_role";

revoke update on table "public"."project_schedules" from "service_role";

revoke delete on table "public"."project_statuses" from "anon";

revoke insert on table "public"."project_statuses" from "anon";

revoke references on table "public"."project_statuses" from "anon";

revoke select on table "public"."project_statuses" from "anon";

revoke trigger on table "public"."project_statuses" from "anon";

revoke truncate on table "public"."project_statuses" from "anon";

revoke update on table "public"."project_statuses" from "anon";

revoke delete on table "public"."project_statuses" from "authenticated";

revoke insert on table "public"."project_statuses" from "authenticated";

revoke references on table "public"."project_statuses" from "authenticated";

revoke select on table "public"."project_statuses" from "authenticated";

revoke trigger on table "public"."project_statuses" from "authenticated";

revoke truncate on table "public"."project_statuses" from "authenticated";

revoke update on table "public"."project_statuses" from "authenticated";

revoke delete on table "public"."project_statuses" from "service_role";

revoke insert on table "public"."project_statuses" from "service_role";

revoke references on table "public"."project_statuses" from "service_role";

revoke select on table "public"."project_statuses" from "service_role";

revoke trigger on table "public"."project_statuses" from "service_role";

revoke truncate on table "public"."project_statuses" from "service_role";

revoke update on table "public"."project_statuses" from "service_role";

revoke delete on table "public"."project_tasks" from "anon";

revoke insert on table "public"."project_tasks" from "anon";

revoke references on table "public"."project_tasks" from "anon";

revoke select on table "public"."project_tasks" from "anon";

revoke trigger on table "public"."project_tasks" from "anon";

revoke truncate on table "public"."project_tasks" from "anon";

revoke update on table "public"."project_tasks" from "anon";

revoke delete on table "public"."project_tasks" from "authenticated";

revoke insert on table "public"."project_tasks" from "authenticated";

revoke references on table "public"."project_tasks" from "authenticated";

revoke select on table "public"."project_tasks" from "authenticated";

revoke trigger on table "public"."project_tasks" from "authenticated";

revoke truncate on table "public"."project_tasks" from "authenticated";

revoke update on table "public"."project_tasks" from "authenticated";

revoke delete on table "public"."project_tasks" from "service_role";

revoke insert on table "public"."project_tasks" from "service_role";

revoke references on table "public"."project_tasks" from "service_role";

revoke select on table "public"."project_tasks" from "service_role";

revoke trigger on table "public"."project_tasks" from "service_role";

revoke truncate on table "public"."project_tasks" from "service_role";

revoke update on table "public"."project_tasks" from "service_role";

revoke delete on table "public"."project_templates" from "anon";

revoke insert on table "public"."project_templates" from "anon";

revoke references on table "public"."project_templates" from "anon";

revoke select on table "public"."project_templates" from "anon";

revoke trigger on table "public"."project_templates" from "anon";

revoke truncate on table "public"."project_templates" from "anon";

revoke update on table "public"."project_templates" from "anon";

revoke delete on table "public"."project_templates" from "authenticated";

revoke insert on table "public"."project_templates" from "authenticated";

revoke references on table "public"."project_templates" from "authenticated";

revoke select on table "public"."project_templates" from "authenticated";

revoke trigger on table "public"."project_templates" from "authenticated";

revoke truncate on table "public"."project_templates" from "authenticated";

revoke update on table "public"."project_templates" from "authenticated";

revoke delete on table "public"."project_templates" from "service_role";

revoke insert on table "public"."project_templates" from "service_role";

revoke references on table "public"."project_templates" from "service_role";

revoke select on table "public"."project_templates" from "service_role";

revoke trigger on table "public"."project_templates" from "service_role";

revoke truncate on table "public"."project_templates" from "service_role";

revoke update on table "public"."project_templates" from "service_role";

revoke delete on table "public"."project_timesheets" from "anon";

revoke insert on table "public"."project_timesheets" from "anon";

revoke references on table "public"."project_timesheets" from "anon";

revoke select on table "public"."project_timesheets" from "anon";

revoke trigger on table "public"."project_timesheets" from "anon";

revoke truncate on table "public"."project_timesheets" from "anon";

revoke update on table "public"."project_timesheets" from "anon";

revoke delete on table "public"."project_timesheets" from "authenticated";

revoke insert on table "public"."project_timesheets" from "authenticated";

revoke references on table "public"."project_timesheets" from "authenticated";

revoke select on table "public"."project_timesheets" from "authenticated";

revoke trigger on table "public"."project_timesheets" from "authenticated";

revoke truncate on table "public"."project_timesheets" from "authenticated";

revoke update on table "public"."project_timesheets" from "authenticated";

revoke delete on table "public"."project_timesheets" from "service_role";

revoke insert on table "public"."project_timesheets" from "service_role";

revoke references on table "public"."project_timesheets" from "service_role";

revoke select on table "public"."project_timesheets" from "service_role";

revoke trigger on table "public"."project_timesheets" from "service_role";

revoke truncate on table "public"."project_timesheets" from "service_role";

revoke update on table "public"."project_timesheets" from "service_role";

revoke delete on table "public"."projects" from "anon";

revoke insert on table "public"."projects" from "anon";

revoke references on table "public"."projects" from "anon";

revoke select on table "public"."projects" from "anon";

revoke trigger on table "public"."projects" from "anon";

revoke truncate on table "public"."projects" from "anon";

revoke update on table "public"."projects" from "anon";

revoke delete on table "public"."projects" from "authenticated";

revoke insert on table "public"."projects" from "authenticated";

revoke references on table "public"."projects" from "authenticated";

revoke select on table "public"."projects" from "authenticated";

revoke trigger on table "public"."projects" from "authenticated";

revoke truncate on table "public"."projects" from "authenticated";

revoke update on table "public"."projects" from "authenticated";

revoke delete on table "public"."projects" from "service_role";

revoke insert on table "public"."projects" from "service_role";

revoke references on table "public"."projects" from "service_role";

revoke select on table "public"."projects" from "service_role";

revoke trigger on table "public"."projects" from "service_role";

revoke truncate on table "public"."projects" from "service_role";

revoke update on table "public"."projects" from "service_role";

revoke delete on table "public"."purchase_items" from "anon";

revoke insert on table "public"."purchase_items" from "anon";

revoke references on table "public"."purchase_items" from "anon";

revoke select on table "public"."purchase_items" from "anon";

revoke trigger on table "public"."purchase_items" from "anon";

revoke truncate on table "public"."purchase_items" from "anon";

revoke update on table "public"."purchase_items" from "anon";

revoke delete on table "public"."purchase_items" from "authenticated";

revoke insert on table "public"."purchase_items" from "authenticated";

revoke references on table "public"."purchase_items" from "authenticated";

revoke select on table "public"."purchase_items" from "authenticated";

revoke trigger on table "public"."purchase_items" from "authenticated";

revoke truncate on table "public"."purchase_items" from "authenticated";

revoke update on table "public"."purchase_items" from "authenticated";

revoke delete on table "public"."purchase_items" from "service_role";

revoke insert on table "public"."purchase_items" from "service_role";

revoke references on table "public"."purchase_items" from "service_role";

revoke select on table "public"."purchase_items" from "service_role";

revoke trigger on table "public"."purchase_items" from "service_role";

revoke truncate on table "public"."purchase_items" from "service_role";

revoke update on table "public"."purchase_items" from "service_role";

revoke delete on table "public"."purchase_orders" from "anon";

revoke insert on table "public"."purchase_orders" from "anon";

revoke references on table "public"."purchase_orders" from "anon";

revoke select on table "public"."purchase_orders" from "anon";

revoke trigger on table "public"."purchase_orders" from "anon";

revoke truncate on table "public"."purchase_orders" from "anon";

revoke update on table "public"."purchase_orders" from "anon";

revoke delete on table "public"."purchase_orders" from "authenticated";

revoke insert on table "public"."purchase_orders" from "authenticated";

revoke references on table "public"."purchase_orders" from "authenticated";

revoke select on table "public"."purchase_orders" from "authenticated";

revoke trigger on table "public"."purchase_orders" from "authenticated";

revoke truncate on table "public"."purchase_orders" from "authenticated";

revoke update on table "public"."purchase_orders" from "authenticated";

revoke delete on table "public"."purchase_orders" from "service_role";

revoke insert on table "public"."purchase_orders" from "service_role";

revoke references on table "public"."purchase_orders" from "service_role";

revoke select on table "public"."purchase_orders" from "service_role";

revoke trigger on table "public"."purchase_orders" from "service_role";

revoke truncate on table "public"."purchase_orders" from "service_role";

revoke update on table "public"."purchase_orders" from "service_role";

revoke delete on table "public"."purchase_receipts" from "anon";

revoke insert on table "public"."purchase_receipts" from "anon";

revoke references on table "public"."purchase_receipts" from "anon";

revoke select on table "public"."purchase_receipts" from "anon";

revoke trigger on table "public"."purchase_receipts" from "anon";

revoke truncate on table "public"."purchase_receipts" from "anon";

revoke update on table "public"."purchase_receipts" from "anon";

revoke delete on table "public"."purchase_receipts" from "authenticated";

revoke insert on table "public"."purchase_receipts" from "authenticated";

revoke references on table "public"."purchase_receipts" from "authenticated";

revoke select on table "public"."purchase_receipts" from "authenticated";

revoke trigger on table "public"."purchase_receipts" from "authenticated";

revoke truncate on table "public"."purchase_receipts" from "authenticated";

revoke update on table "public"."purchase_receipts" from "authenticated";

revoke delete on table "public"."purchase_receipts" from "service_role";

revoke insert on table "public"."purchase_receipts" from "service_role";

revoke references on table "public"."purchase_receipts" from "service_role";

revoke select on table "public"."purchase_receipts" from "service_role";

revoke trigger on table "public"."purchase_receipts" from "service_role";

revoke truncate on table "public"."purchase_receipts" from "service_role";

revoke update on table "public"."purchase_receipts" from "service_role";

revoke delete on table "public"."purchases" from "anon";

revoke insert on table "public"."purchases" from "anon";

revoke references on table "public"."purchases" from "anon";

revoke select on table "public"."purchases" from "anon";

revoke trigger on table "public"."purchases" from "anon";

revoke truncate on table "public"."purchases" from "anon";

revoke update on table "public"."purchases" from "anon";

revoke delete on table "public"."purchases" from "authenticated";

revoke insert on table "public"."purchases" from "authenticated";

revoke references on table "public"."purchases" from "authenticated";

revoke select on table "public"."purchases" from "authenticated";

revoke trigger on table "public"."purchases" from "authenticated";

revoke truncate on table "public"."purchases" from "authenticated";

revoke update on table "public"."purchases" from "authenticated";

revoke delete on table "public"."purchases" from "service_role";

revoke insert on table "public"."purchases" from "service_role";

revoke references on table "public"."purchases" from "service_role";

revoke select on table "public"."purchases" from "service_role";

revoke trigger on table "public"."purchases" from "service_role";

revoke truncate on table "public"."purchases" from "service_role";

revoke update on table "public"."purchases" from "service_role";

revoke delete on table "public"."quote_items" from "anon";

revoke insert on table "public"."quote_items" from "anon";

revoke references on table "public"."quote_items" from "anon";

revoke select on table "public"."quote_items" from "anon";

revoke trigger on table "public"."quote_items" from "anon";

revoke truncate on table "public"."quote_items" from "anon";

revoke update on table "public"."quote_items" from "anon";

revoke delete on table "public"."quote_items" from "authenticated";

revoke insert on table "public"."quote_items" from "authenticated";

revoke references on table "public"."quote_items" from "authenticated";

revoke select on table "public"."quote_items" from "authenticated";

revoke trigger on table "public"."quote_items" from "authenticated";

revoke truncate on table "public"."quote_items" from "authenticated";

revoke update on table "public"."quote_items" from "authenticated";

revoke delete on table "public"."quote_items" from "service_role";

revoke insert on table "public"."quote_items" from "service_role";

revoke references on table "public"."quote_items" from "service_role";

revoke select on table "public"."quote_items" from "service_role";

revoke trigger on table "public"."quote_items" from "service_role";

revoke truncate on table "public"."quote_items" from "service_role";

revoke update on table "public"."quote_items" from "service_role";

revoke delete on table "public"."quotes" from "anon";

revoke insert on table "public"."quotes" from "anon";

revoke references on table "public"."quotes" from "anon";

revoke select on table "public"."quotes" from "anon";

revoke trigger on table "public"."quotes" from "anon";

revoke truncate on table "public"."quotes" from "anon";

revoke update on table "public"."quotes" from "anon";

revoke delete on table "public"."quotes" from "authenticated";

revoke insert on table "public"."quotes" from "authenticated";

revoke references on table "public"."quotes" from "authenticated";

revoke select on table "public"."quotes" from "authenticated";

revoke trigger on table "public"."quotes" from "authenticated";

revoke truncate on table "public"."quotes" from "authenticated";

revoke update on table "public"."quotes" from "authenticated";

revoke delete on table "public"."quotes" from "service_role";

revoke insert on table "public"."quotes" from "service_role";

revoke references on table "public"."quotes" from "service_role";

revoke select on table "public"."quotes" from "service_role";

revoke trigger on table "public"."quotes" from "service_role";

revoke truncate on table "public"."quotes" from "service_role";

revoke update on table "public"."quotes" from "service_role";

revoke delete on table "public"."report_cache" from "anon";

revoke insert on table "public"."report_cache" from "anon";

revoke references on table "public"."report_cache" from "anon";

revoke select on table "public"."report_cache" from "anon";

revoke trigger on table "public"."report_cache" from "anon";

revoke truncate on table "public"."report_cache" from "anon";

revoke update on table "public"."report_cache" from "anon";

revoke delete on table "public"."report_cache" from "authenticated";

revoke insert on table "public"."report_cache" from "authenticated";

revoke references on table "public"."report_cache" from "authenticated";

revoke select on table "public"."report_cache" from "authenticated";

revoke trigger on table "public"."report_cache" from "authenticated";

revoke truncate on table "public"."report_cache" from "authenticated";

revoke update on table "public"."report_cache" from "authenticated";

revoke delete on table "public"."report_cache" from "service_role";

revoke insert on table "public"."report_cache" from "service_role";

revoke references on table "public"."report_cache" from "service_role";

revoke select on table "public"."report_cache" from "service_role";

revoke trigger on table "public"."report_cache" from "service_role";

revoke truncate on table "public"."report_cache" from "service_role";

revoke update on table "public"."report_cache" from "service_role";

revoke delete on table "public"."report_executions" from "anon";

revoke insert on table "public"."report_executions" from "anon";

revoke references on table "public"."report_executions" from "anon";

revoke select on table "public"."report_executions" from "anon";

revoke trigger on table "public"."report_executions" from "anon";

revoke truncate on table "public"."report_executions" from "anon";

revoke update on table "public"."report_executions" from "anon";

revoke delete on table "public"."report_executions" from "authenticated";

revoke insert on table "public"."report_executions" from "authenticated";

revoke references on table "public"."report_executions" from "authenticated";

revoke select on table "public"."report_executions" from "authenticated";

revoke trigger on table "public"."report_executions" from "authenticated";

revoke truncate on table "public"."report_executions" from "authenticated";

revoke update on table "public"."report_executions" from "authenticated";

revoke delete on table "public"."report_executions" from "service_role";

revoke insert on table "public"."report_executions" from "service_role";

revoke references on table "public"."report_executions" from "service_role";

revoke select on table "public"."report_executions" from "service_role";

revoke trigger on table "public"."report_executions" from "service_role";

revoke truncate on table "public"."report_executions" from "service_role";

revoke update on table "public"."report_executions" from "service_role";

revoke delete on table "public"."report_templates" from "anon";

revoke insert on table "public"."report_templates" from "anon";

revoke references on table "public"."report_templates" from "anon";

revoke select on table "public"."report_templates" from "anon";

revoke trigger on table "public"."report_templates" from "anon";

revoke truncate on table "public"."report_templates" from "anon";

revoke update on table "public"."report_templates" from "anon";

revoke delete on table "public"."report_templates" from "authenticated";

revoke insert on table "public"."report_templates" from "authenticated";

revoke references on table "public"."report_templates" from "authenticated";

revoke select on table "public"."report_templates" from "authenticated";

revoke trigger on table "public"."report_templates" from "authenticated";

revoke truncate on table "public"."report_templates" from "authenticated";

revoke update on table "public"."report_templates" from "authenticated";

revoke delete on table "public"."report_templates" from "service_role";

revoke insert on table "public"."report_templates" from "service_role";

revoke references on table "public"."report_templates" from "service_role";

revoke select on table "public"."report_templates" from "service_role";

revoke trigger on table "public"."report_templates" from "service_role";

revoke truncate on table "public"."report_templates" from "service_role";

revoke update on table "public"."report_templates" from "service_role";

revoke delete on table "public"."resource_allocations" from "anon";

revoke insert on table "public"."resource_allocations" from "anon";

revoke references on table "public"."resource_allocations" from "anon";

revoke select on table "public"."resource_allocations" from "anon";

revoke trigger on table "public"."resource_allocations" from "anon";

revoke truncate on table "public"."resource_allocations" from "anon";

revoke update on table "public"."resource_allocations" from "anon";

revoke delete on table "public"."resource_allocations" from "authenticated";

revoke insert on table "public"."resource_allocations" from "authenticated";

revoke references on table "public"."resource_allocations" from "authenticated";

revoke select on table "public"."resource_allocations" from "authenticated";

revoke trigger on table "public"."resource_allocations" from "authenticated";

revoke truncate on table "public"."resource_allocations" from "authenticated";

revoke update on table "public"."resource_allocations" from "authenticated";

revoke delete on table "public"."resource_allocations" from "service_role";

revoke insert on table "public"."resource_allocations" from "service_role";

revoke references on table "public"."resource_allocations" from "service_role";

revoke select on table "public"."resource_allocations" from "service_role";

revoke trigger on table "public"."resource_allocations" from "service_role";

revoke truncate on table "public"."resource_allocations" from "service_role";

revoke update on table "public"."resource_allocations" from "service_role";

revoke delete on table "public"."rfa_calculations" from "anon";

revoke insert on table "public"."rfa_calculations" from "anon";

revoke references on table "public"."rfa_calculations" from "anon";

revoke select on table "public"."rfa_calculations" from "anon";

revoke trigger on table "public"."rfa_calculations" from "anon";

revoke truncate on table "public"."rfa_calculations" from "anon";

revoke update on table "public"."rfa_calculations" from "anon";

revoke delete on table "public"."rfa_calculations" from "authenticated";

revoke insert on table "public"."rfa_calculations" from "authenticated";

revoke references on table "public"."rfa_calculations" from "authenticated";

revoke select on table "public"."rfa_calculations" from "authenticated";

revoke trigger on table "public"."rfa_calculations" from "authenticated";

revoke truncate on table "public"."rfa_calculations" from "authenticated";

revoke update on table "public"."rfa_calculations" from "authenticated";

revoke delete on table "public"."rfa_calculations" from "service_role";

revoke insert on table "public"."rfa_calculations" from "service_role";

revoke references on table "public"."rfa_calculations" from "service_role";

revoke select on table "public"."rfa_calculations" from "service_role";

revoke trigger on table "public"."rfa_calculations" from "service_role";

revoke truncate on table "public"."rfa_calculations" from "service_role";

revoke update on table "public"."rfa_calculations" from "service_role";

revoke delete on table "public"."role_permissions" from "anon";

revoke insert on table "public"."role_permissions" from "anon";

revoke references on table "public"."role_permissions" from "anon";

revoke select on table "public"."role_permissions" from "anon";

revoke trigger on table "public"."role_permissions" from "anon";

revoke truncate on table "public"."role_permissions" from "anon";

revoke update on table "public"."role_permissions" from "anon";

revoke delete on table "public"."role_permissions" from "authenticated";

revoke insert on table "public"."role_permissions" from "authenticated";

revoke references on table "public"."role_permissions" from "authenticated";

revoke select on table "public"."role_permissions" from "authenticated";

revoke trigger on table "public"."role_permissions" from "authenticated";

revoke truncate on table "public"."role_permissions" from "authenticated";

revoke update on table "public"."role_permissions" from "authenticated";

revoke delete on table "public"."role_permissions" from "service_role";

revoke insert on table "public"."role_permissions" from "service_role";

revoke references on table "public"."role_permissions" from "service_role";

revoke select on table "public"."role_permissions" from "service_role";

revoke trigger on table "public"."role_permissions" from "service_role";

revoke truncate on table "public"."role_permissions" from "service_role";

revoke update on table "public"."role_permissions" from "service_role";

revoke delete on table "public"."roles" from "anon";

revoke insert on table "public"."roles" from "anon";

revoke references on table "public"."roles" from "anon";

revoke select on table "public"."roles" from "anon";

revoke trigger on table "public"."roles" from "anon";

revoke truncate on table "public"."roles" from "anon";

revoke update on table "public"."roles" from "anon";

revoke delete on table "public"."roles" from "authenticated";

revoke insert on table "public"."roles" from "authenticated";

revoke references on table "public"."roles" from "authenticated";

revoke select on table "public"."roles" from "authenticated";

revoke trigger on table "public"."roles" from "authenticated";

revoke truncate on table "public"."roles" from "authenticated";

revoke update on table "public"."roles" from "authenticated";

revoke delete on table "public"."roles" from "service_role";

revoke insert on table "public"."roles" from "service_role";

revoke references on table "public"."roles" from "service_role";

revoke select on table "public"."roles" from "service_role";

revoke trigger on table "public"."roles" from "service_role";

revoke truncate on table "public"."roles" from "service_role";

revoke update on table "public"."roles" from "service_role";

revoke delete on table "public"."sectors_catalog" from "anon";

revoke insert on table "public"."sectors_catalog" from "anon";

revoke references on table "public"."sectors_catalog" from "anon";

revoke select on table "public"."sectors_catalog" from "anon";

revoke trigger on table "public"."sectors_catalog" from "anon";

revoke truncate on table "public"."sectors_catalog" from "anon";

revoke update on table "public"."sectors_catalog" from "anon";

revoke delete on table "public"."sectors_catalog" from "authenticated";

revoke insert on table "public"."sectors_catalog" from "authenticated";

revoke references on table "public"."sectors_catalog" from "authenticated";

revoke select on table "public"."sectors_catalog" from "authenticated";

revoke trigger on table "public"."sectors_catalog" from "authenticated";

revoke truncate on table "public"."sectors_catalog" from "authenticated";

revoke update on table "public"."sectors_catalog" from "authenticated";

revoke delete on table "public"."sectors_catalog" from "service_role";

revoke insert on table "public"."sectors_catalog" from "service_role";

revoke references on table "public"."sectors_catalog" from "service_role";

revoke select on table "public"."sectors_catalog" from "service_role";

revoke trigger on table "public"."sectors_catalog" from "service_role";

revoke truncate on table "public"."sectors_catalog" from "service_role";

revoke update on table "public"."sectors_catalog" from "service_role";

revoke delete on table "public"."security_configurations" from "anon";

revoke insert on table "public"."security_configurations" from "anon";

revoke references on table "public"."security_configurations" from "anon";

revoke select on table "public"."security_configurations" from "anon";

revoke trigger on table "public"."security_configurations" from "anon";

revoke truncate on table "public"."security_configurations" from "anon";

revoke update on table "public"."security_configurations" from "anon";

revoke delete on table "public"."security_configurations" from "authenticated";

revoke insert on table "public"."security_configurations" from "authenticated";

revoke references on table "public"."security_configurations" from "authenticated";

revoke select on table "public"."security_configurations" from "authenticated";

revoke trigger on table "public"."security_configurations" from "authenticated";

revoke truncate on table "public"."security_configurations" from "authenticated";

revoke update on table "public"."security_configurations" from "authenticated";

revoke delete on table "public"."security_configurations" from "service_role";

revoke insert on table "public"."security_configurations" from "service_role";

revoke references on table "public"."security_configurations" from "service_role";

revoke select on table "public"."security_configurations" from "service_role";

revoke trigger on table "public"."security_configurations" from "service_role";

revoke truncate on table "public"."security_configurations" from "service_role";

revoke update on table "public"."security_configurations" from "service_role";

revoke delete on table "public"."security_events" from "anon";

revoke insert on table "public"."security_events" from "anon";

revoke references on table "public"."security_events" from "anon";

revoke select on table "public"."security_events" from "anon";

revoke trigger on table "public"."security_events" from "anon";

revoke truncate on table "public"."security_events" from "anon";

revoke update on table "public"."security_events" from "anon";

revoke delete on table "public"."security_events" from "authenticated";

revoke insert on table "public"."security_events" from "authenticated";

revoke references on table "public"."security_events" from "authenticated";

revoke select on table "public"."security_events" from "authenticated";

revoke trigger on table "public"."security_events" from "authenticated";

revoke truncate on table "public"."security_events" from "authenticated";

revoke update on table "public"."security_events" from "authenticated";

revoke delete on table "public"."security_events" from "service_role";

revoke insert on table "public"."security_events" from "service_role";

revoke references on table "public"."security_events" from "service_role";

revoke select on table "public"."security_events" from "service_role";

revoke trigger on table "public"."security_events" from "service_role";

revoke truncate on table "public"."security_events" from "service_role";

revoke update on table "public"."security_events" from "service_role";

revoke delete on table "public"."serial_numbers" from "anon";

revoke insert on table "public"."serial_numbers" from "anon";

revoke references on table "public"."serial_numbers" from "anon";

revoke select on table "public"."serial_numbers" from "anon";

revoke trigger on table "public"."serial_numbers" from "anon";

revoke truncate on table "public"."serial_numbers" from "anon";

revoke update on table "public"."serial_numbers" from "anon";

revoke delete on table "public"."serial_numbers" from "authenticated";

revoke insert on table "public"."serial_numbers" from "authenticated";

revoke references on table "public"."serial_numbers" from "authenticated";

revoke select on table "public"."serial_numbers" from "authenticated";

revoke trigger on table "public"."serial_numbers" from "authenticated";

revoke truncate on table "public"."serial_numbers" from "authenticated";

revoke update on table "public"."serial_numbers" from "authenticated";

revoke delete on table "public"."serial_numbers" from "service_role";

revoke insert on table "public"."serial_numbers" from "service_role";

revoke references on table "public"."serial_numbers" from "service_role";

revoke select on table "public"."serial_numbers" from "service_role";

revoke trigger on table "public"."serial_numbers" from "service_role";

revoke truncate on table "public"."serial_numbers" from "service_role";

revoke update on table "public"."serial_numbers" from "service_role";

revoke delete on table "public"."service_accounts" from "anon";

revoke insert on table "public"."service_accounts" from "anon";

revoke references on table "public"."service_accounts" from "anon";

revoke select on table "public"."service_accounts" from "anon";

revoke trigger on table "public"."service_accounts" from "anon";

revoke truncate on table "public"."service_accounts" from "anon";

revoke update on table "public"."service_accounts" from "anon";

revoke delete on table "public"."service_accounts" from "authenticated";

revoke insert on table "public"."service_accounts" from "authenticated";

revoke references on table "public"."service_accounts" from "authenticated";

revoke select on table "public"."service_accounts" from "authenticated";

revoke trigger on table "public"."service_accounts" from "authenticated";

revoke truncate on table "public"."service_accounts" from "authenticated";

revoke update on table "public"."service_accounts" from "authenticated";

revoke delete on table "public"."service_accounts" from "service_role";

revoke insert on table "public"."service_accounts" from "service_role";

revoke references on table "public"."service_accounts" from "service_role";

revoke select on table "public"."service_accounts" from "service_role";

revoke trigger on table "public"."service_accounts" from "service_role";

revoke truncate on table "public"."service_accounts" from "service_role";

revoke update on table "public"."service_accounts" from "service_role";

revoke delete on table "public"."skill_assessments" from "anon";

revoke insert on table "public"."skill_assessments" from "anon";

revoke references on table "public"."skill_assessments" from "anon";

revoke select on table "public"."skill_assessments" from "anon";

revoke trigger on table "public"."skill_assessments" from "anon";

revoke truncate on table "public"."skill_assessments" from "anon";

revoke update on table "public"."skill_assessments" from "anon";

revoke delete on table "public"."skill_assessments" from "authenticated";

revoke insert on table "public"."skill_assessments" from "authenticated";

revoke references on table "public"."skill_assessments" from "authenticated";

revoke select on table "public"."skill_assessments" from "authenticated";

revoke trigger on table "public"."skill_assessments" from "authenticated";

revoke truncate on table "public"."skill_assessments" from "authenticated";

revoke update on table "public"."skill_assessments" from "authenticated";

revoke delete on table "public"."skill_assessments" from "service_role";

revoke insert on table "public"."skill_assessments" from "service_role";

revoke references on table "public"."skill_assessments" from "service_role";

revoke select on table "public"."skill_assessments" from "service_role";

revoke trigger on table "public"."skill_assessments" from "service_role";

revoke truncate on table "public"."skill_assessments" from "service_role";

revoke update on table "public"."skill_assessments" from "service_role";

revoke delete on table "public"."smart_alerts" from "anon";

revoke insert on table "public"."smart_alerts" from "anon";

revoke references on table "public"."smart_alerts" from "anon";

revoke select on table "public"."smart_alerts" from "anon";

revoke trigger on table "public"."smart_alerts" from "anon";

revoke truncate on table "public"."smart_alerts" from "anon";

revoke update on table "public"."smart_alerts" from "anon";

revoke delete on table "public"."smart_alerts" from "authenticated";

revoke insert on table "public"."smart_alerts" from "authenticated";

revoke references on table "public"."smart_alerts" from "authenticated";

revoke select on table "public"."smart_alerts" from "authenticated";

revoke trigger on table "public"."smart_alerts" from "authenticated";

revoke truncate on table "public"."smart_alerts" from "authenticated";

revoke update on table "public"."smart_alerts" from "authenticated";

revoke delete on table "public"."smart_alerts" from "service_role";

revoke insert on table "public"."smart_alerts" from "service_role";

revoke references on table "public"."smart_alerts" from "service_role";

revoke select on table "public"."smart_alerts" from "service_role";

revoke trigger on table "public"."smart_alerts" from "service_role";

revoke truncate on table "public"."smart_alerts" from "service_role";

revoke update on table "public"."smart_alerts" from "service_role";

revoke delete on table "public"."stock_alerts" from "anon";

revoke insert on table "public"."stock_alerts" from "anon";

revoke references on table "public"."stock_alerts" from "anon";

revoke select on table "public"."stock_alerts" from "anon";

revoke trigger on table "public"."stock_alerts" from "anon";

revoke truncate on table "public"."stock_alerts" from "anon";

revoke update on table "public"."stock_alerts" from "anon";

revoke delete on table "public"."stock_alerts" from "authenticated";

revoke insert on table "public"."stock_alerts" from "authenticated";

revoke references on table "public"."stock_alerts" from "authenticated";

revoke select on table "public"."stock_alerts" from "authenticated";

revoke trigger on table "public"."stock_alerts" from "authenticated";

revoke truncate on table "public"."stock_alerts" from "authenticated";

revoke update on table "public"."stock_alerts" from "authenticated";

revoke delete on table "public"."stock_alerts" from "service_role";

revoke insert on table "public"."stock_alerts" from "service_role";

revoke references on table "public"."stock_alerts" from "service_role";

revoke select on table "public"."stock_alerts" from "service_role";

revoke trigger on table "public"."stock_alerts" from "service_role";

revoke truncate on table "public"."stock_alerts" from "service_role";

revoke update on table "public"."stock_alerts" from "service_role";

revoke delete on table "public"."stripe_customers" from "anon";

revoke insert on table "public"."stripe_customers" from "anon";

revoke references on table "public"."stripe_customers" from "anon";

revoke select on table "public"."stripe_customers" from "anon";

revoke trigger on table "public"."stripe_customers" from "anon";

revoke truncate on table "public"."stripe_customers" from "anon";

revoke update on table "public"."stripe_customers" from "anon";

revoke delete on table "public"."stripe_customers" from "authenticated";

revoke insert on table "public"."stripe_customers" from "authenticated";

revoke references on table "public"."stripe_customers" from "authenticated";

revoke select on table "public"."stripe_customers" from "authenticated";

revoke trigger on table "public"."stripe_customers" from "authenticated";

revoke truncate on table "public"."stripe_customers" from "authenticated";

revoke update on table "public"."stripe_customers" from "authenticated";

revoke delete on table "public"."stripe_customers" from "service_role";

revoke insert on table "public"."stripe_customers" from "service_role";

revoke references on table "public"."stripe_customers" from "service_role";

revoke select on table "public"."stripe_customers" from "service_role";

revoke trigger on table "public"."stripe_customers" from "service_role";

revoke truncate on table "public"."stripe_customers" from "service_role";

revoke update on table "public"."stripe_customers" from "service_role";

revoke delete on table "public"."subscription_plans" from "anon";

revoke insert on table "public"."subscription_plans" from "anon";

revoke references on table "public"."subscription_plans" from "anon";

revoke select on table "public"."subscription_plans" from "anon";

revoke trigger on table "public"."subscription_plans" from "anon";

revoke truncate on table "public"."subscription_plans" from "anon";

revoke update on table "public"."subscription_plans" from "anon";

revoke delete on table "public"."subscription_plans" from "authenticated";

revoke insert on table "public"."subscription_plans" from "authenticated";

revoke references on table "public"."subscription_plans" from "authenticated";

revoke select on table "public"."subscription_plans" from "authenticated";

revoke trigger on table "public"."subscription_plans" from "authenticated";

revoke truncate on table "public"."subscription_plans" from "authenticated";

revoke update on table "public"."subscription_plans" from "authenticated";

revoke delete on table "public"."subscription_plans" from "service_role";

revoke insert on table "public"."subscription_plans" from "service_role";

revoke references on table "public"."subscription_plans" from "service_role";

revoke select on table "public"."subscription_plans" from "service_role";

revoke trigger on table "public"."subscription_plans" from "service_role";

revoke truncate on table "public"."subscription_plans" from "service_role";

revoke update on table "public"."subscription_plans" from "service_role";

revoke delete on table "public"."subscriptions" from "anon";

revoke insert on table "public"."subscriptions" from "anon";

revoke references on table "public"."subscriptions" from "anon";

revoke select on table "public"."subscriptions" from "anon";

revoke trigger on table "public"."subscriptions" from "anon";

revoke truncate on table "public"."subscriptions" from "anon";

revoke update on table "public"."subscriptions" from "anon";

revoke delete on table "public"."subscriptions" from "authenticated";

revoke insert on table "public"."subscriptions" from "authenticated";

revoke references on table "public"."subscriptions" from "authenticated";

revoke select on table "public"."subscriptions" from "authenticated";

revoke trigger on table "public"."subscriptions" from "authenticated";

revoke truncate on table "public"."subscriptions" from "authenticated";

revoke update on table "public"."subscriptions" from "authenticated";

revoke delete on table "public"."subscriptions" from "service_role";

revoke insert on table "public"."subscriptions" from "service_role";

revoke references on table "public"."subscriptions" from "service_role";

revoke select on table "public"."subscriptions" from "service_role";

revoke trigger on table "public"."subscriptions" from "service_role";

revoke truncate on table "public"."subscriptions" from "service_role";

revoke update on table "public"."subscriptions" from "service_role";

revoke delete on table "public"."supplier_contact_persons" from "anon";

revoke insert on table "public"."supplier_contact_persons" from "anon";

revoke references on table "public"."supplier_contact_persons" from "anon";

revoke select on table "public"."supplier_contact_persons" from "anon";

revoke trigger on table "public"."supplier_contact_persons" from "anon";

revoke truncate on table "public"."supplier_contact_persons" from "anon";

revoke update on table "public"."supplier_contact_persons" from "anon";

revoke delete on table "public"."supplier_contact_persons" from "authenticated";

revoke insert on table "public"."supplier_contact_persons" from "authenticated";

revoke references on table "public"."supplier_contact_persons" from "authenticated";

revoke select on table "public"."supplier_contact_persons" from "authenticated";

revoke trigger on table "public"."supplier_contact_persons" from "authenticated";

revoke truncate on table "public"."supplier_contact_persons" from "authenticated";

revoke update on table "public"."supplier_contact_persons" from "authenticated";

revoke delete on table "public"."supplier_contact_persons" from "service_role";

revoke insert on table "public"."supplier_contact_persons" from "service_role";

revoke references on table "public"."supplier_contact_persons" from "service_role";

revoke select on table "public"."supplier_contact_persons" from "service_role";

revoke trigger on table "public"."supplier_contact_persons" from "service_role";

revoke truncate on table "public"."supplier_contact_persons" from "service_role";

revoke update on table "public"."supplier_contact_persons" from "service_role";

revoke delete on table "public"."supplier_payments" from "anon";

revoke insert on table "public"."supplier_payments" from "anon";

revoke references on table "public"."supplier_payments" from "anon";

revoke select on table "public"."supplier_payments" from "anon";

revoke trigger on table "public"."supplier_payments" from "anon";

revoke truncate on table "public"."supplier_payments" from "anon";

revoke update on table "public"."supplier_payments" from "anon";

revoke delete on table "public"."supplier_payments" from "authenticated";

revoke insert on table "public"."supplier_payments" from "authenticated";

revoke references on table "public"."supplier_payments" from "authenticated";

revoke select on table "public"."supplier_payments" from "authenticated";

revoke trigger on table "public"."supplier_payments" from "authenticated";

revoke truncate on table "public"."supplier_payments" from "authenticated";

revoke update on table "public"."supplier_payments" from "authenticated";

revoke delete on table "public"."supplier_payments" from "service_role";

revoke insert on table "public"."supplier_payments" from "service_role";

revoke references on table "public"."supplier_payments" from "service_role";

revoke select on table "public"."supplier_payments" from "service_role";

revoke trigger on table "public"."supplier_payments" from "service_role";

revoke truncate on table "public"."supplier_payments" from "service_role";

revoke update on table "public"."supplier_payments" from "service_role";

revoke delete on table "public"."suppliers" from "anon";

revoke insert on table "public"."suppliers" from "anon";

revoke references on table "public"."suppliers" from "anon";

revoke select on table "public"."suppliers" from "anon";

revoke trigger on table "public"."suppliers" from "anon";

revoke truncate on table "public"."suppliers" from "anon";

revoke update on table "public"."suppliers" from "anon";

revoke delete on table "public"."suppliers" from "authenticated";

revoke insert on table "public"."suppliers" from "authenticated";

revoke references on table "public"."suppliers" from "authenticated";

revoke select on table "public"."suppliers" from "authenticated";

revoke trigger on table "public"."suppliers" from "authenticated";

revoke truncate on table "public"."suppliers" from "authenticated";

revoke update on table "public"."suppliers" from "authenticated";

revoke delete on table "public"."suppliers" from "service_role";

revoke insert on table "public"."suppliers" from "service_role";

revoke references on table "public"."suppliers" from "service_role";

revoke select on table "public"."suppliers" from "service_role";

revoke trigger on table "public"."suppliers" from "service_role";

revoke truncate on table "public"."suppliers" from "service_role";

revoke update on table "public"."suppliers" from "service_role";

revoke delete on table "public"."survey_responses" from "anon";

revoke insert on table "public"."survey_responses" from "anon";

revoke references on table "public"."survey_responses" from "anon";

revoke select on table "public"."survey_responses" from "anon";

revoke trigger on table "public"."survey_responses" from "anon";

revoke truncate on table "public"."survey_responses" from "anon";

revoke update on table "public"."survey_responses" from "anon";

revoke delete on table "public"."survey_responses" from "authenticated";

revoke insert on table "public"."survey_responses" from "authenticated";

revoke references on table "public"."survey_responses" from "authenticated";

revoke select on table "public"."survey_responses" from "authenticated";

revoke trigger on table "public"."survey_responses" from "authenticated";

revoke truncate on table "public"."survey_responses" from "authenticated";

revoke update on table "public"."survey_responses" from "authenticated";

revoke delete on table "public"."survey_responses" from "service_role";

revoke insert on table "public"."survey_responses" from "service_role";

revoke references on table "public"."survey_responses" from "service_role";

revoke select on table "public"."survey_responses" from "service_role";

revoke trigger on table "public"."survey_responses" from "service_role";

revoke truncate on table "public"."survey_responses" from "service_role";

revoke update on table "public"."survey_responses" from "service_role";

revoke delete on table "public"."system_configurations" from "anon";

revoke insert on table "public"."system_configurations" from "anon";

revoke references on table "public"."system_configurations" from "anon";

revoke select on table "public"."system_configurations" from "anon";

revoke trigger on table "public"."system_configurations" from "anon";

revoke truncate on table "public"."system_configurations" from "anon";

revoke update on table "public"."system_configurations" from "anon";

revoke delete on table "public"."system_configurations" from "authenticated";

revoke insert on table "public"."system_configurations" from "authenticated";

revoke references on table "public"."system_configurations" from "authenticated";

revoke select on table "public"."system_configurations" from "authenticated";

revoke trigger on table "public"."system_configurations" from "authenticated";

revoke truncate on table "public"."system_configurations" from "authenticated";

revoke update on table "public"."system_configurations" from "authenticated";

revoke delete on table "public"."system_configurations" from "service_role";

revoke insert on table "public"."system_configurations" from "service_role";

revoke references on table "public"."system_configurations" from "service_role";

revoke select on table "public"."system_configurations" from "service_role";

revoke trigger on table "public"."system_configurations" from "service_role";

revoke truncate on table "public"."system_configurations" from "service_role";

revoke update on table "public"."system_configurations" from "service_role";

revoke delete on table "public"."task_attachments" from "anon";

revoke insert on table "public"."task_attachments" from "anon";

revoke references on table "public"."task_attachments" from "anon";

revoke select on table "public"."task_attachments" from "anon";

revoke trigger on table "public"."task_attachments" from "anon";

revoke truncate on table "public"."task_attachments" from "anon";

revoke update on table "public"."task_attachments" from "anon";

revoke delete on table "public"."task_attachments" from "authenticated";

revoke insert on table "public"."task_attachments" from "authenticated";

revoke references on table "public"."task_attachments" from "authenticated";

revoke select on table "public"."task_attachments" from "authenticated";

revoke trigger on table "public"."task_attachments" from "authenticated";

revoke truncate on table "public"."task_attachments" from "authenticated";

revoke update on table "public"."task_attachments" from "authenticated";

revoke delete on table "public"."task_attachments" from "service_role";

revoke insert on table "public"."task_attachments" from "service_role";

revoke references on table "public"."task_attachments" from "service_role";

revoke select on table "public"."task_attachments" from "service_role";

revoke trigger on table "public"."task_attachments" from "service_role";

revoke truncate on table "public"."task_attachments" from "service_role";

revoke update on table "public"."task_attachments" from "service_role";

revoke delete on table "public"."task_checklists" from "anon";

revoke insert on table "public"."task_checklists" from "anon";

revoke references on table "public"."task_checklists" from "anon";

revoke select on table "public"."task_checklists" from "anon";

revoke trigger on table "public"."task_checklists" from "anon";

revoke truncate on table "public"."task_checklists" from "anon";

revoke update on table "public"."task_checklists" from "anon";

revoke delete on table "public"."task_checklists" from "authenticated";

revoke insert on table "public"."task_checklists" from "authenticated";

revoke references on table "public"."task_checklists" from "authenticated";

revoke select on table "public"."task_checklists" from "authenticated";

revoke trigger on table "public"."task_checklists" from "authenticated";

revoke truncate on table "public"."task_checklists" from "authenticated";

revoke update on table "public"."task_checklists" from "authenticated";

revoke delete on table "public"."task_checklists" from "service_role";

revoke insert on table "public"."task_checklists" from "service_role";

revoke references on table "public"."task_checklists" from "service_role";

revoke select on table "public"."task_checklists" from "service_role";

revoke trigger on table "public"."task_checklists" from "service_role";

revoke truncate on table "public"."task_checklists" from "service_role";

revoke update on table "public"."task_checklists" from "service_role";

revoke delete on table "public"."task_comments" from "anon";

revoke insert on table "public"."task_comments" from "anon";

revoke references on table "public"."task_comments" from "anon";

revoke select on table "public"."task_comments" from "anon";

revoke trigger on table "public"."task_comments" from "anon";

revoke truncate on table "public"."task_comments" from "anon";

revoke update on table "public"."task_comments" from "anon";

revoke delete on table "public"."task_comments" from "authenticated";

revoke insert on table "public"."task_comments" from "authenticated";

revoke references on table "public"."task_comments" from "authenticated";

revoke select on table "public"."task_comments" from "authenticated";

revoke trigger on table "public"."task_comments" from "authenticated";

revoke truncate on table "public"."task_comments" from "authenticated";

revoke update on table "public"."task_comments" from "authenticated";

revoke delete on table "public"."task_comments" from "service_role";

revoke insert on table "public"."task_comments" from "service_role";

revoke references on table "public"."task_comments" from "service_role";

revoke select on table "public"."task_comments" from "service_role";

revoke trigger on table "public"."task_comments" from "service_role";

revoke truncate on table "public"."task_comments" from "service_role";

revoke update on table "public"."task_comments" from "service_role";

revoke delete on table "public"."task_dependencies" from "anon";

revoke insert on table "public"."task_dependencies" from "anon";

revoke references on table "public"."task_dependencies" from "anon";

revoke select on table "public"."task_dependencies" from "anon";

revoke trigger on table "public"."task_dependencies" from "anon";

revoke truncate on table "public"."task_dependencies" from "anon";

revoke update on table "public"."task_dependencies" from "anon";

revoke delete on table "public"."task_dependencies" from "authenticated";

revoke insert on table "public"."task_dependencies" from "authenticated";

revoke references on table "public"."task_dependencies" from "authenticated";

revoke select on table "public"."task_dependencies" from "authenticated";

revoke trigger on table "public"."task_dependencies" from "authenticated";

revoke truncate on table "public"."task_dependencies" from "authenticated";

revoke update on table "public"."task_dependencies" from "authenticated";

revoke delete on table "public"."task_dependencies" from "service_role";

revoke insert on table "public"."task_dependencies" from "service_role";

revoke references on table "public"."task_dependencies" from "service_role";

revoke select on table "public"."task_dependencies" from "service_role";

revoke trigger on table "public"."task_dependencies" from "service_role";

revoke truncate on table "public"."task_dependencies" from "service_role";

revoke update on table "public"."task_dependencies" from "service_role";

revoke delete on table "public"."task_statuses" from "anon";

revoke insert on table "public"."task_statuses" from "anon";

revoke references on table "public"."task_statuses" from "anon";

revoke select on table "public"."task_statuses" from "anon";

revoke trigger on table "public"."task_statuses" from "anon";

revoke truncate on table "public"."task_statuses" from "anon";

revoke update on table "public"."task_statuses" from "anon";

revoke delete on table "public"."task_statuses" from "authenticated";

revoke insert on table "public"."task_statuses" from "authenticated";

revoke references on table "public"."task_statuses" from "authenticated";

revoke select on table "public"."task_statuses" from "authenticated";

revoke trigger on table "public"."task_statuses" from "authenticated";

revoke truncate on table "public"."task_statuses" from "authenticated";

revoke update on table "public"."task_statuses" from "authenticated";

revoke delete on table "public"."task_statuses" from "service_role";

revoke insert on table "public"."task_statuses" from "service_role";

revoke references on table "public"."task_statuses" from "service_role";

revoke select on table "public"."task_statuses" from "service_role";

revoke trigger on table "public"."task_statuses" from "service_role";

revoke truncate on table "public"."task_statuses" from "service_role";

revoke update on table "public"."task_statuses" from "service_role";

revoke delete on table "public"."task_types" from "anon";

revoke insert on table "public"."task_types" from "anon";

revoke references on table "public"."task_types" from "anon";

revoke select on table "public"."task_types" from "anon";

revoke trigger on table "public"."task_types" from "anon";

revoke truncate on table "public"."task_types" from "anon";

revoke update on table "public"."task_types" from "anon";

revoke delete on table "public"."task_types" from "authenticated";

revoke insert on table "public"."task_types" from "authenticated";

revoke references on table "public"."task_types" from "authenticated";

revoke select on table "public"."task_types" from "authenticated";

revoke trigger on table "public"."task_types" from "authenticated";

revoke truncate on table "public"."task_types" from "authenticated";

revoke update on table "public"."task_types" from "authenticated";

revoke delete on table "public"."task_types" from "service_role";

revoke insert on table "public"."task_types" from "service_role";

revoke references on table "public"."task_types" from "service_role";

revoke select on table "public"."task_types" from "service_role";

revoke trigger on table "public"."task_types" from "service_role";

revoke truncate on table "public"."task_types" from "service_role";

revoke update on table "public"."task_types" from "service_role";

revoke delete on table "public"."tax_declarations" from "anon";

revoke insert on table "public"."tax_declarations" from "anon";

revoke references on table "public"."tax_declarations" from "anon";

revoke select on table "public"."tax_declarations" from "anon";

revoke trigger on table "public"."tax_declarations" from "anon";

revoke truncate on table "public"."tax_declarations" from "anon";

revoke update on table "public"."tax_declarations" from "anon";

revoke delete on table "public"."tax_declarations" from "authenticated";

revoke insert on table "public"."tax_declarations" from "authenticated";

revoke references on table "public"."tax_declarations" from "authenticated";

revoke select on table "public"."tax_declarations" from "authenticated";

revoke trigger on table "public"."tax_declarations" from "authenticated";

revoke truncate on table "public"."tax_declarations" from "authenticated";

revoke update on table "public"."tax_declarations" from "authenticated";

revoke delete on table "public"."tax_declarations" from "service_role";

revoke insert on table "public"."tax_declarations" from "service_role";

revoke references on table "public"."tax_declarations" from "service_role";

revoke select on table "public"."tax_declarations" from "service_role";

revoke trigger on table "public"."tax_declarations" from "service_role";

revoke truncate on table "public"."tax_declarations" from "service_role";

revoke update on table "public"."tax_declarations" from "service_role";

revoke delete on table "public"."tax_optimizations" from "anon";

revoke insert on table "public"."tax_optimizations" from "anon";

revoke references on table "public"."tax_optimizations" from "anon";

revoke select on table "public"."tax_optimizations" from "anon";

revoke trigger on table "public"."tax_optimizations" from "anon";

revoke truncate on table "public"."tax_optimizations" from "anon";

revoke update on table "public"."tax_optimizations" from "anon";

revoke delete on table "public"."tax_optimizations" from "authenticated";

revoke insert on table "public"."tax_optimizations" from "authenticated";

revoke references on table "public"."tax_optimizations" from "authenticated";

revoke select on table "public"."tax_optimizations" from "authenticated";

revoke trigger on table "public"."tax_optimizations" from "authenticated";

revoke truncate on table "public"."tax_optimizations" from "authenticated";

revoke update on table "public"."tax_optimizations" from "authenticated";

revoke delete on table "public"."tax_optimizations" from "service_role";

revoke insert on table "public"."tax_optimizations" from "service_role";

revoke references on table "public"."tax_optimizations" from "service_role";

revoke select on table "public"."tax_optimizations" from "service_role";

revoke trigger on table "public"."tax_optimizations" from "service_role";

revoke truncate on table "public"."tax_optimizations" from "service_role";

revoke update on table "public"."tax_optimizations" from "service_role";

revoke delete on table "public"."tax_rates_catalog" from "anon";

revoke insert on table "public"."tax_rates_catalog" from "anon";

revoke references on table "public"."tax_rates_catalog" from "anon";

revoke select on table "public"."tax_rates_catalog" from "anon";

revoke trigger on table "public"."tax_rates_catalog" from "anon";

revoke truncate on table "public"."tax_rates_catalog" from "anon";

revoke update on table "public"."tax_rates_catalog" from "anon";

revoke delete on table "public"."tax_rates_catalog" from "authenticated";

revoke insert on table "public"."tax_rates_catalog" from "authenticated";

revoke references on table "public"."tax_rates_catalog" from "authenticated";

revoke select on table "public"."tax_rates_catalog" from "authenticated";

revoke trigger on table "public"."tax_rates_catalog" from "authenticated";

revoke truncate on table "public"."tax_rates_catalog" from "authenticated";

revoke update on table "public"."tax_rates_catalog" from "authenticated";

revoke delete on table "public"."tax_rates_catalog" from "service_role";

revoke insert on table "public"."tax_rates_catalog" from "service_role";

revoke references on table "public"."tax_rates_catalog" from "service_role";

revoke select on table "public"."tax_rates_catalog" from "service_role";

revoke trigger on table "public"."tax_rates_catalog" from "service_role";

revoke truncate on table "public"."tax_rates_catalog" from "service_role";

revoke update on table "public"."tax_rates_catalog" from "service_role";

revoke delete on table "public"."third_parties" from "anon";

revoke insert on table "public"."third_parties" from "anon";

revoke references on table "public"."third_parties" from "anon";

revoke select on table "public"."third_parties" from "anon";

revoke trigger on table "public"."third_parties" from "anon";

revoke truncate on table "public"."third_parties" from "anon";

revoke update on table "public"."third_parties" from "anon";

revoke delete on table "public"."third_parties" from "authenticated";

revoke insert on table "public"."third_parties" from "authenticated";

revoke references on table "public"."third_parties" from "authenticated";

revoke select on table "public"."third_parties" from "authenticated";

revoke trigger on table "public"."third_parties" from "authenticated";

revoke truncate on table "public"."third_parties" from "authenticated";

revoke update on table "public"."third_parties" from "authenticated";

revoke delete on table "public"."third_parties" from "service_role";

revoke insert on table "public"."third_parties" from "service_role";

revoke references on table "public"."third_parties" from "service_role";

revoke select on table "public"."third_parties" from "service_role";

revoke trigger on table "public"."third_parties" from "service_role";

revoke truncate on table "public"."third_parties" from "service_role";

revoke update on table "public"."third_parties" from "service_role";

revoke delete on table "public"."third_party_addresses" from "anon";

revoke insert on table "public"."third_party_addresses" from "anon";

revoke references on table "public"."third_party_addresses" from "anon";

revoke select on table "public"."third_party_addresses" from "anon";

revoke trigger on table "public"."third_party_addresses" from "anon";

revoke truncate on table "public"."third_party_addresses" from "anon";

revoke update on table "public"."third_party_addresses" from "anon";

revoke delete on table "public"."third_party_addresses" from "authenticated";

revoke insert on table "public"."third_party_addresses" from "authenticated";

revoke references on table "public"."third_party_addresses" from "authenticated";

revoke select on table "public"."third_party_addresses" from "authenticated";

revoke trigger on table "public"."third_party_addresses" from "authenticated";

revoke truncate on table "public"."third_party_addresses" from "authenticated";

revoke update on table "public"."third_party_addresses" from "authenticated";

revoke delete on table "public"."third_party_addresses" from "service_role";

revoke insert on table "public"."third_party_addresses" from "service_role";

revoke references on table "public"."third_party_addresses" from "service_role";

revoke select on table "public"."third_party_addresses" from "service_role";

revoke trigger on table "public"."third_party_addresses" from "service_role";

revoke truncate on table "public"."third_party_addresses" from "service_role";

revoke update on table "public"."third_party_addresses" from "service_role";

revoke delete on table "public"."third_party_categories" from "anon";

revoke insert on table "public"."third_party_categories" from "anon";

revoke references on table "public"."third_party_categories" from "anon";

revoke select on table "public"."third_party_categories" from "anon";

revoke trigger on table "public"."third_party_categories" from "anon";

revoke truncate on table "public"."third_party_categories" from "anon";

revoke update on table "public"."third_party_categories" from "anon";

revoke delete on table "public"."third_party_categories" from "authenticated";

revoke insert on table "public"."third_party_categories" from "authenticated";

revoke references on table "public"."third_party_categories" from "authenticated";

revoke select on table "public"."third_party_categories" from "authenticated";

revoke trigger on table "public"."third_party_categories" from "authenticated";

revoke truncate on table "public"."third_party_categories" from "authenticated";

revoke update on table "public"."third_party_categories" from "authenticated";

revoke delete on table "public"."third_party_categories" from "service_role";

revoke insert on table "public"."third_party_categories" from "service_role";

revoke references on table "public"."third_party_categories" from "service_role";

revoke select on table "public"."third_party_categories" from "service_role";

revoke trigger on table "public"."third_party_categories" from "service_role";

revoke truncate on table "public"."third_party_categories" from "service_role";

revoke update on table "public"."third_party_categories" from "service_role";

revoke delete on table "public"."third_party_documents" from "anon";

revoke insert on table "public"."third_party_documents" from "anon";

revoke references on table "public"."third_party_documents" from "anon";

revoke select on table "public"."third_party_documents" from "anon";

revoke trigger on table "public"."third_party_documents" from "anon";

revoke truncate on table "public"."third_party_documents" from "anon";

revoke update on table "public"."third_party_documents" from "anon";

revoke delete on table "public"."third_party_documents" from "authenticated";

revoke insert on table "public"."third_party_documents" from "authenticated";

revoke references on table "public"."third_party_documents" from "authenticated";

revoke select on table "public"."third_party_documents" from "authenticated";

revoke trigger on table "public"."third_party_documents" from "authenticated";

revoke truncate on table "public"."third_party_documents" from "authenticated";

revoke update on table "public"."third_party_documents" from "authenticated";

revoke delete on table "public"."third_party_documents" from "service_role";

revoke insert on table "public"."third_party_documents" from "service_role";

revoke references on table "public"."third_party_documents" from "service_role";

revoke select on table "public"."third_party_documents" from "service_role";

revoke trigger on table "public"."third_party_documents" from "service_role";

revoke truncate on table "public"."third_party_documents" from "service_role";

revoke update on table "public"."third_party_documents" from "service_role";

revoke delete on table "public"."time_tracking" from "anon";

revoke insert on table "public"."time_tracking" from "anon";

revoke references on table "public"."time_tracking" from "anon";

revoke select on table "public"."time_tracking" from "anon";

revoke trigger on table "public"."time_tracking" from "anon";

revoke truncate on table "public"."time_tracking" from "anon";

revoke update on table "public"."time_tracking" from "anon";

revoke delete on table "public"."time_tracking" from "authenticated";

revoke insert on table "public"."time_tracking" from "authenticated";

revoke references on table "public"."time_tracking" from "authenticated";

revoke select on table "public"."time_tracking" from "authenticated";

revoke trigger on table "public"."time_tracking" from "authenticated";

revoke truncate on table "public"."time_tracking" from "authenticated";

revoke update on table "public"."time_tracking" from "authenticated";

revoke delete on table "public"."time_tracking" from "service_role";

revoke insert on table "public"."time_tracking" from "service_role";

revoke references on table "public"."time_tracking" from "service_role";

revoke select on table "public"."time_tracking" from "service_role";

revoke trigger on table "public"."time_tracking" from "service_role";

revoke truncate on table "public"."time_tracking" from "service_role";

revoke update on table "public"."time_tracking" from "service_role";

revoke delete on table "public"."timezones_catalog" from "anon";

revoke insert on table "public"."timezones_catalog" from "anon";

revoke references on table "public"."timezones_catalog" from "anon";

revoke select on table "public"."timezones_catalog" from "anon";

revoke trigger on table "public"."timezones_catalog" from "anon";

revoke truncate on table "public"."timezones_catalog" from "anon";

revoke update on table "public"."timezones_catalog" from "anon";

revoke delete on table "public"."timezones_catalog" from "authenticated";

revoke insert on table "public"."timezones_catalog" from "authenticated";

revoke references on table "public"."timezones_catalog" from "authenticated";

revoke select on table "public"."timezones_catalog" from "authenticated";

revoke trigger on table "public"."timezones_catalog" from "authenticated";

revoke truncate on table "public"."timezones_catalog" from "authenticated";

revoke update on table "public"."timezones_catalog" from "authenticated";

revoke delete on table "public"."timezones_catalog" from "service_role";

revoke insert on table "public"."timezones_catalog" from "service_role";

revoke references on table "public"."timezones_catalog" from "service_role";

revoke select on table "public"."timezones_catalog" from "service_role";

revoke trigger on table "public"."timezones_catalog" from "service_role";

revoke truncate on table "public"."timezones_catalog" from "service_role";

revoke update on table "public"."timezones_catalog" from "service_role";

revoke delete on table "public"."training_records" from "anon";

revoke insert on table "public"."training_records" from "anon";

revoke references on table "public"."training_records" from "anon";

revoke select on table "public"."training_records" from "anon";

revoke trigger on table "public"."training_records" from "anon";

revoke truncate on table "public"."training_records" from "anon";

revoke update on table "public"."training_records" from "anon";

revoke delete on table "public"."training_records" from "authenticated";

revoke insert on table "public"."training_records" from "authenticated";

revoke references on table "public"."training_records" from "authenticated";

revoke select on table "public"."training_records" from "authenticated";

revoke trigger on table "public"."training_records" from "authenticated";

revoke truncate on table "public"."training_records" from "authenticated";

revoke update on table "public"."training_records" from "authenticated";

revoke delete on table "public"."training_records" from "service_role";

revoke insert on table "public"."training_records" from "service_role";

revoke references on table "public"."training_records" from "service_role";

revoke select on table "public"."training_records" from "service_role";

revoke trigger on table "public"."training_records" from "service_role";

revoke truncate on table "public"."training_records" from "service_role";

revoke update on table "public"."training_records" from "service_role";

revoke delete on table "public"."usage_tracking" from "anon";

revoke insert on table "public"."usage_tracking" from "anon";

revoke references on table "public"."usage_tracking" from "anon";

revoke select on table "public"."usage_tracking" from "anon";

revoke trigger on table "public"."usage_tracking" from "anon";

revoke truncate on table "public"."usage_tracking" from "anon";

revoke update on table "public"."usage_tracking" from "anon";

revoke delete on table "public"."usage_tracking" from "authenticated";

revoke insert on table "public"."usage_tracking" from "authenticated";

revoke references on table "public"."usage_tracking" from "authenticated";

revoke select on table "public"."usage_tracking" from "authenticated";

revoke trigger on table "public"."usage_tracking" from "authenticated";

revoke truncate on table "public"."usage_tracking" from "authenticated";

revoke update on table "public"."usage_tracking" from "authenticated";

revoke delete on table "public"."usage_tracking" from "service_role";

revoke insert on table "public"."usage_tracking" from "service_role";

revoke references on table "public"."usage_tracking" from "service_role";

revoke select on table "public"."usage_tracking" from "service_role";

revoke trigger on table "public"."usage_tracking" from "service_role";

revoke truncate on table "public"."usage_tracking" from "service_role";

revoke update on table "public"."usage_tracking" from "service_role";

revoke delete on table "public"."user_activity_log" from "anon";

revoke insert on table "public"."user_activity_log" from "anon";

revoke references on table "public"."user_activity_log" from "anon";

revoke select on table "public"."user_activity_log" from "anon";

revoke trigger on table "public"."user_activity_log" from "anon";

revoke truncate on table "public"."user_activity_log" from "anon";

revoke update on table "public"."user_activity_log" from "anon";

revoke delete on table "public"."user_activity_log" from "authenticated";

revoke insert on table "public"."user_activity_log" from "authenticated";

revoke references on table "public"."user_activity_log" from "authenticated";

revoke select on table "public"."user_activity_log" from "authenticated";

revoke trigger on table "public"."user_activity_log" from "authenticated";

revoke truncate on table "public"."user_activity_log" from "authenticated";

revoke update on table "public"."user_activity_log" from "authenticated";

revoke delete on table "public"."user_activity_log" from "service_role";

revoke insert on table "public"."user_activity_log" from "service_role";

revoke references on table "public"."user_activity_log" from "service_role";

revoke select on table "public"."user_activity_log" from "service_role";

revoke trigger on table "public"."user_activity_log" from "service_role";

revoke truncate on table "public"."user_activity_log" from "service_role";

revoke update on table "public"."user_activity_log" from "service_role";

revoke delete on table "public"."user_activity_logs" from "anon";

revoke insert on table "public"."user_activity_logs" from "anon";

revoke references on table "public"."user_activity_logs" from "anon";

revoke select on table "public"."user_activity_logs" from "anon";

revoke trigger on table "public"."user_activity_logs" from "anon";

revoke truncate on table "public"."user_activity_logs" from "anon";

revoke update on table "public"."user_activity_logs" from "anon";

revoke delete on table "public"."user_activity_logs" from "authenticated";

revoke insert on table "public"."user_activity_logs" from "authenticated";

revoke references on table "public"."user_activity_logs" from "authenticated";

revoke select on table "public"."user_activity_logs" from "authenticated";

revoke trigger on table "public"."user_activity_logs" from "authenticated";

revoke truncate on table "public"."user_activity_logs" from "authenticated";

revoke update on table "public"."user_activity_logs" from "authenticated";

revoke delete on table "public"."user_activity_logs" from "service_role";

revoke insert on table "public"."user_activity_logs" from "service_role";

revoke references on table "public"."user_activity_logs" from "service_role";

revoke select on table "public"."user_activity_logs" from "service_role";

revoke trigger on table "public"."user_activity_logs" from "service_role";

revoke truncate on table "public"."user_activity_logs" from "service_role";

revoke update on table "public"."user_activity_logs" from "service_role";

revoke delete on table "public"."user_companies" from "anon";

revoke insert on table "public"."user_companies" from "anon";

revoke references on table "public"."user_companies" from "anon";

revoke select on table "public"."user_companies" from "anon";

revoke trigger on table "public"."user_companies" from "anon";

revoke truncate on table "public"."user_companies" from "anon";

revoke update on table "public"."user_companies" from "anon";

revoke delete on table "public"."user_companies" from "authenticated";

revoke insert on table "public"."user_companies" from "authenticated";

revoke references on table "public"."user_companies" from "authenticated";

revoke select on table "public"."user_companies" from "authenticated";

revoke trigger on table "public"."user_companies" from "authenticated";

revoke truncate on table "public"."user_companies" from "authenticated";

revoke update on table "public"."user_companies" from "authenticated";

revoke delete on table "public"."user_companies" from "service_role";

revoke insert on table "public"."user_companies" from "service_role";

revoke references on table "public"."user_companies" from "service_role";

revoke select on table "public"."user_companies" from "service_role";

revoke trigger on table "public"."user_companies" from "service_role";

revoke truncate on table "public"."user_companies" from "service_role";

revoke update on table "public"."user_companies" from "service_role";

revoke delete on table "public"."user_deletion_requests" from "anon";

revoke insert on table "public"."user_deletion_requests" from "anon";

revoke references on table "public"."user_deletion_requests" from "anon";

revoke select on table "public"."user_deletion_requests" from "anon";

revoke trigger on table "public"."user_deletion_requests" from "anon";

revoke truncate on table "public"."user_deletion_requests" from "anon";

revoke update on table "public"."user_deletion_requests" from "anon";

revoke delete on table "public"."user_deletion_requests" from "authenticated";

revoke insert on table "public"."user_deletion_requests" from "authenticated";

revoke references on table "public"."user_deletion_requests" from "authenticated";

revoke select on table "public"."user_deletion_requests" from "authenticated";

revoke trigger on table "public"."user_deletion_requests" from "authenticated";

revoke truncate on table "public"."user_deletion_requests" from "authenticated";

revoke update on table "public"."user_deletion_requests" from "authenticated";

revoke delete on table "public"."user_deletion_requests" from "service_role";

revoke insert on table "public"."user_deletion_requests" from "service_role";

revoke references on table "public"."user_deletion_requests" from "service_role";

revoke select on table "public"."user_deletion_requests" from "service_role";

revoke trigger on table "public"."user_deletion_requests" from "service_role";

revoke truncate on table "public"."user_deletion_requests" from "service_role";

revoke update on table "public"."user_deletion_requests" from "service_role";

revoke delete on table "public"."user_notifications" from "anon";

revoke insert on table "public"."user_notifications" from "anon";

revoke references on table "public"."user_notifications" from "anon";

revoke select on table "public"."user_notifications" from "anon";

revoke trigger on table "public"."user_notifications" from "anon";

revoke truncate on table "public"."user_notifications" from "anon";

revoke update on table "public"."user_notifications" from "anon";

revoke delete on table "public"."user_notifications" from "authenticated";

revoke insert on table "public"."user_notifications" from "authenticated";

revoke references on table "public"."user_notifications" from "authenticated";

revoke select on table "public"."user_notifications" from "authenticated";

revoke trigger on table "public"."user_notifications" from "authenticated";

revoke truncate on table "public"."user_notifications" from "authenticated";

revoke update on table "public"."user_notifications" from "authenticated";

revoke delete on table "public"."user_notifications" from "service_role";

revoke insert on table "public"."user_notifications" from "service_role";

revoke references on table "public"."user_notifications" from "service_role";

revoke select on table "public"."user_notifications" from "service_role";

revoke trigger on table "public"."user_notifications" from "service_role";

revoke truncate on table "public"."user_notifications" from "service_role";

revoke update on table "public"."user_notifications" from "service_role";

revoke delete on table "public"."user_permissions" from "anon";

revoke insert on table "public"."user_permissions" from "anon";

revoke references on table "public"."user_permissions" from "anon";

revoke select on table "public"."user_permissions" from "anon";

revoke trigger on table "public"."user_permissions" from "anon";

revoke truncate on table "public"."user_permissions" from "anon";

revoke update on table "public"."user_permissions" from "anon";

revoke delete on table "public"."user_permissions" from "authenticated";

revoke insert on table "public"."user_permissions" from "authenticated";

revoke references on table "public"."user_permissions" from "authenticated";

revoke select on table "public"."user_permissions" from "authenticated";

revoke trigger on table "public"."user_permissions" from "authenticated";

revoke truncate on table "public"."user_permissions" from "authenticated";

revoke update on table "public"."user_permissions" from "authenticated";

revoke delete on table "public"."user_permissions" from "service_role";

revoke insert on table "public"."user_permissions" from "service_role";

revoke references on table "public"."user_permissions" from "service_role";

revoke select on table "public"."user_permissions" from "service_role";

revoke trigger on table "public"."user_permissions" from "service_role";

revoke truncate on table "public"."user_permissions" from "service_role";

revoke update on table "public"."user_permissions" from "service_role";

revoke delete on table "public"."user_preferences" from "anon";

revoke insert on table "public"."user_preferences" from "anon";

revoke references on table "public"."user_preferences" from "anon";

revoke select on table "public"."user_preferences" from "anon";

revoke trigger on table "public"."user_preferences" from "anon";

revoke truncate on table "public"."user_preferences" from "anon";

revoke update on table "public"."user_preferences" from "anon";

revoke delete on table "public"."user_preferences" from "authenticated";

revoke insert on table "public"."user_preferences" from "authenticated";

revoke references on table "public"."user_preferences" from "authenticated";

revoke select on table "public"."user_preferences" from "authenticated";

revoke trigger on table "public"."user_preferences" from "authenticated";

revoke truncate on table "public"."user_preferences" from "authenticated";

revoke update on table "public"."user_preferences" from "authenticated";

revoke delete on table "public"."user_preferences" from "service_role";

revoke insert on table "public"."user_preferences" from "service_role";

revoke references on table "public"."user_preferences" from "service_role";

revoke select on table "public"."user_preferences" from "service_role";

revoke trigger on table "public"."user_preferences" from "service_role";

revoke truncate on table "public"."user_preferences" from "service_role";

revoke update on table "public"."user_preferences" from "service_role";

revoke delete on table "public"."user_profiles" from "anon";

revoke insert on table "public"."user_profiles" from "anon";

revoke references on table "public"."user_profiles" from "anon";

revoke select on table "public"."user_profiles" from "anon";

revoke trigger on table "public"."user_profiles" from "anon";

revoke truncate on table "public"."user_profiles" from "anon";

revoke update on table "public"."user_profiles" from "anon";

revoke delete on table "public"."user_profiles" from "authenticated";

revoke insert on table "public"."user_profiles" from "authenticated";

revoke references on table "public"."user_profiles" from "authenticated";

revoke select on table "public"."user_profiles" from "authenticated";

revoke trigger on table "public"."user_profiles" from "authenticated";

revoke truncate on table "public"."user_profiles" from "authenticated";

revoke update on table "public"."user_profiles" from "authenticated";

revoke delete on table "public"."user_profiles" from "service_role";

revoke insert on table "public"."user_profiles" from "service_role";

revoke references on table "public"."user_profiles" from "service_role";

revoke select on table "public"."user_profiles" from "service_role";

revoke trigger on table "public"."user_profiles" from "service_role";

revoke truncate on table "public"."user_profiles" from "service_role";

revoke update on table "public"."user_profiles" from "service_role";

revoke delete on table "public"."user_sessions" from "anon";

revoke insert on table "public"."user_sessions" from "anon";

revoke references on table "public"."user_sessions" from "anon";

revoke select on table "public"."user_sessions" from "anon";

revoke trigger on table "public"."user_sessions" from "anon";

revoke truncate on table "public"."user_sessions" from "anon";

revoke update on table "public"."user_sessions" from "anon";

revoke delete on table "public"."user_sessions" from "authenticated";

revoke insert on table "public"."user_sessions" from "authenticated";

revoke references on table "public"."user_sessions" from "authenticated";

revoke select on table "public"."user_sessions" from "authenticated";

revoke trigger on table "public"."user_sessions" from "authenticated";

revoke truncate on table "public"."user_sessions" from "authenticated";

revoke update on table "public"."user_sessions" from "authenticated";

revoke delete on table "public"."user_sessions" from "service_role";

revoke insert on table "public"."user_sessions" from "service_role";

revoke references on table "public"."user_sessions" from "service_role";

revoke select on table "public"."user_sessions" from "service_role";

revoke trigger on table "public"."user_sessions" from "service_role";

revoke truncate on table "public"."user_sessions" from "service_role";

revoke update on table "public"."user_sessions" from "service_role";

revoke delete on table "public"."user_subscriptions" from "anon";

revoke insert on table "public"."user_subscriptions" from "anon";

revoke references on table "public"."user_subscriptions" from "anon";

revoke select on table "public"."user_subscriptions" from "anon";

revoke trigger on table "public"."user_subscriptions" from "anon";

revoke truncate on table "public"."user_subscriptions" from "anon";

revoke update on table "public"."user_subscriptions" from "anon";

revoke delete on table "public"."user_subscriptions" from "authenticated";

revoke insert on table "public"."user_subscriptions" from "authenticated";

revoke references on table "public"."user_subscriptions" from "authenticated";

revoke select on table "public"."user_subscriptions" from "authenticated";

revoke trigger on table "public"."user_subscriptions" from "authenticated";

revoke truncate on table "public"."user_subscriptions" from "authenticated";

revoke update on table "public"."user_subscriptions" from "authenticated";

revoke delete on table "public"."user_subscriptions" from "service_role";

revoke insert on table "public"."user_subscriptions" from "service_role";

revoke references on table "public"."user_subscriptions" from "service_role";

revoke select on table "public"."user_subscriptions" from "service_role";

revoke trigger on table "public"."user_subscriptions" from "service_role";

revoke truncate on table "public"."user_subscriptions" from "service_role";

revoke update on table "public"."user_subscriptions" from "service_role";

revoke delete on table "public"."warehouses" from "anon";

revoke insert on table "public"."warehouses" from "anon";

revoke references on table "public"."warehouses" from "anon";

revoke select on table "public"."warehouses" from "anon";

revoke trigger on table "public"."warehouses" from "anon";

revoke truncate on table "public"."warehouses" from "anon";

revoke update on table "public"."warehouses" from "anon";

revoke delete on table "public"."warehouses" from "authenticated";

revoke insert on table "public"."warehouses" from "authenticated";

revoke references on table "public"."warehouses" from "authenticated";

revoke select on table "public"."warehouses" from "authenticated";

revoke trigger on table "public"."warehouses" from "authenticated";

revoke truncate on table "public"."warehouses" from "authenticated";

revoke update on table "public"."warehouses" from "authenticated";

revoke delete on table "public"."warehouses" from "service_role";

revoke insert on table "public"."warehouses" from "service_role";

revoke references on table "public"."warehouses" from "service_role";

revoke select on table "public"."warehouses" from "service_role";

revoke trigger on table "public"."warehouses" from "service_role";

revoke truncate on table "public"."warehouses" from "service_role";

revoke update on table "public"."warehouses" from "service_role";

revoke delete on table "public"."webhook_settings" from "anon";

revoke insert on table "public"."webhook_settings" from "anon";

revoke references on table "public"."webhook_settings" from "anon";

revoke select on table "public"."webhook_settings" from "anon";

revoke trigger on table "public"."webhook_settings" from "anon";

revoke truncate on table "public"."webhook_settings" from "anon";

revoke update on table "public"."webhook_settings" from "anon";

revoke delete on table "public"."webhook_settings" from "authenticated";

revoke insert on table "public"."webhook_settings" from "authenticated";

revoke references on table "public"."webhook_settings" from "authenticated";

revoke select on table "public"."webhook_settings" from "authenticated";

revoke trigger on table "public"."webhook_settings" from "authenticated";

revoke truncate on table "public"."webhook_settings" from "authenticated";

revoke update on table "public"."webhook_settings" from "authenticated";

revoke delete on table "public"."webhook_settings" from "service_role";

revoke insert on table "public"."webhook_settings" from "service_role";

revoke references on table "public"."webhook_settings" from "service_role";

revoke select on table "public"."webhook_settings" from "service_role";

revoke trigger on table "public"."webhook_settings" from "service_role";

revoke truncate on table "public"."webhook_settings" from "service_role";

revoke update on table "public"."webhook_settings" from "service_role";

revoke delete on table "public"."workflow_executions" from "anon";

revoke insert on table "public"."workflow_executions" from "anon";

revoke references on table "public"."workflow_executions" from "anon";

revoke select on table "public"."workflow_executions" from "anon";

revoke trigger on table "public"."workflow_executions" from "anon";

revoke truncate on table "public"."workflow_executions" from "anon";

revoke update on table "public"."workflow_executions" from "anon";

revoke delete on table "public"."workflow_executions" from "authenticated";

revoke insert on table "public"."workflow_executions" from "authenticated";

revoke references on table "public"."workflow_executions" from "authenticated";

revoke select on table "public"."workflow_executions" from "authenticated";

revoke trigger on table "public"."workflow_executions" from "authenticated";

revoke truncate on table "public"."workflow_executions" from "authenticated";

revoke update on table "public"."workflow_executions" from "authenticated";

revoke delete on table "public"."workflow_executions" from "service_role";

revoke insert on table "public"."workflow_executions" from "service_role";

revoke references on table "public"."workflow_executions" from "service_role";

revoke select on table "public"."workflow_executions" from "service_role";

revoke trigger on table "public"."workflow_executions" from "service_role";

revoke truncate on table "public"."workflow_executions" from "service_role";

revoke update on table "public"."workflow_executions" from "service_role";

revoke delete on table "public"."workflow_templates" from "anon";

revoke insert on table "public"."workflow_templates" from "anon";

revoke references on table "public"."workflow_templates" from "anon";

revoke select on table "public"."workflow_templates" from "anon";

revoke trigger on table "public"."workflow_templates" from "anon";

revoke truncate on table "public"."workflow_templates" from "anon";

revoke update on table "public"."workflow_templates" from "anon";

revoke delete on table "public"."workflow_templates" from "authenticated";

revoke insert on table "public"."workflow_templates" from "authenticated";

revoke references on table "public"."workflow_templates" from "authenticated";

revoke select on table "public"."workflow_templates" from "authenticated";

revoke trigger on table "public"."workflow_templates" from "authenticated";

revoke truncate on table "public"."workflow_templates" from "authenticated";

revoke update on table "public"."workflow_templates" from "authenticated";

revoke delete on table "public"."workflow_templates" from "service_role";

revoke insert on table "public"."workflow_templates" from "service_role";

revoke references on table "public"."workflow_templates" from "service_role";

revoke select on table "public"."workflow_templates" from "service_role";

revoke trigger on table "public"."workflow_templates" from "service_role";

revoke truncate on table "public"."workflow_templates" from "service_role";

revoke update on table "public"."workflow_templates" from "service_role";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.analyze_budget_variances(p_company_id uuid, p_budget_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_budget_data RECORD;
    v_actual_revenue DECIMAL(15,2) := 0;
    v_actual_expenses DECIMAL(15,2) := 0;
    v_variance_analysis JSON;
BEGIN
    -- Récupération du budget
    SELECT * INTO v_budget_data
    FROM budgets
    WHERE id = p_budget_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Budget non trouvé');
    END IF;

    -- Calcul des réalisés sur la période du budget
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_actual_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_budget_data.start_date AND v_budget_data.end_date
      AND status = 'paid';

    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_actual_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_budget_data.start_date AND v_budget_data.end_date
      AND coa.account_type = 'expense';

    -- Analyse des écarts
    v_variance_analysis := json_build_object(
        'revenue_variance', json_build_object(
            'budgeted', v_budget_data.total_revenue,
            'actual', v_actual_revenue,
            'variance', v_actual_revenue - v_budget_data.total_revenue,
            'variance_percent', CASE
                WHEN v_budget_data.total_revenue > 0 THEN
                    ((v_actual_revenue - v_budget_data.total_revenue) / v_budget_data.total_revenue * 100)
                ELSE 0
            END,
            'status', CASE
                WHEN v_actual_revenue >= v_budget_data.total_revenue * 0.95 THEN 'favorable'
                WHEN v_actual_revenue >= v_budget_data.total_revenue * 0.85 THEN 'attention'
                ELSE 'défavorable'
            END
        ),
        'expense_variance', json_build_object(
            'budgeted', v_budget_data.total_expenses,
            'actual', v_actual_expenses,
            'variance', v_actual_expenses - v_budget_data.total_expenses,
            'variance_percent', CASE
                WHEN v_budget_data.total_expenses > 0 THEN
                    ((v_actual_expenses - v_budget_data.total_expenses) / v_budget_data.total_expenses * 100)
                ELSE 0
            END,
            'status', CASE
                WHEN v_actual_expenses <= v_budget_data.total_expenses * 1.05 THEN 'favorable'
                WHEN v_actual_expenses <= v_budget_data.total_expenses * 1.15 THEN 'attention'
                ELSE 'défavorable'
            END
        ),
        'net_result_variance', json_build_object(
            'budgeted', v_budget_data.net_result,
            'actual', v_actual_revenue - v_actual_expenses,
            'variance', (v_actual_revenue - v_actual_expenses) - v_budget_data.net_result
        )
    );

    v_result := json_build_object(
        'budget_id', p_budget_id,
        'budget_name', v_budget_data.name,
        'period', json_build_object(
            'start_date', v_budget_data.start_date,
            'end_date', v_budget_data.end_date
        ),
        'variance_analysis', v_variance_analysis,
        'recommendations', CASE
            WHEN (v_actual_revenue - v_actual_expenses) >= v_budget_data.net_result * 0.95 THEN
                json_build_array('Objectifs atteints', 'Maintenir la performance')
            ELSE
                json_build_array('Écarts significatifs détectés', 'Plan d''action recommandé')
        END
    );

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.analyze_data_quality()
 RETURNS TABLE(metric_name text, metric_value numeric, percentage numeric, details jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) as total_companies,
            COUNT(*) FILTER (WHERE name IS NOT NULL AND LENGTH(TRIM(name)) > 0) as has_name,
            COUNT(*) FILTER (WHERE siret IS NOT NULL) as has_siret,
            COUNT(*) FILTER (WHERE COALESCE(status, 'active') = 'active') as active_companies,
            AVG(COALESCE(data_quality_score, 0)) as avg_quality_score
        FROM companies
        WHERE COALESCE(status, 'active') != 'merged'
    )
    SELECT
        'Total Companies'::TEXT,
        total_companies::NUMERIC,
        100::NUMERIC,
        json_build_object('count', total_companies)::JSONB
    FROM stats
    UNION ALL
    SELECT
        'Companies with Name'::TEXT,
        has_name::NUMERIC,
        CASE WHEN total_companies > 0 THEN (has_name::NUMERIC / total_companies * 100) ELSE 0 END,
        json_build_object('count', has_name, 'total', total_companies)::JSONB
    FROM stats
    UNION ALL
    SELECT
        'Companies with SIRET'::TEXT,
        has_siret::NUMERIC,
        CASE WHEN total_companies > 0 THEN (has_siret::NUMERIC / total_companies * 100) ELSE 0 END,
        json_build_object('count', has_siret, 'total', total_companies)::JSONB
    FROM stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.analyze_training_trends(p_company_id uuid, p_months_back integer DEFAULT 12)
 RETURNS TABLE(training_category text, total_trainings integer, total_cost numeric, avg_completion_rate numeric, avg_score numeric, roi_estimate numeric, trend_direction text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH training_stats AS (
        SELECT
            tr.training_category,
            COUNT(*) as total_trainings,
            SUM(tr.cost) as total_cost,
            AVG(tr.completion_percentage) as avg_completion_rate,
            AVG(tr.score) as avg_score,
            AVG(tr.roi_estimated) as roi_estimate,
            COUNT(*) FILTER (WHERE tr.start_date >= CURRENT_DATE - INTERVAL '3 months') as recent_count,
            COUNT(*) FILTER (WHERE tr.start_date < CURRENT_DATE - INTERVAL '3 months' AND tr.start_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL) as older_count
        FROM training_records tr
        WHERE tr.company_id = p_company_id
        AND tr.start_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
        GROUP BY tr.training_category
    )
    SELECT
        ts.training_category,
        ts.total_trainings,
        COALESCE(ts.total_cost, 0),
        ts.avg_completion_rate,
        ts.avg_score,
        COALESCE(ts.roi_estimate, 0),
        CASE
            WHEN ts.recent_count > ts.older_count THEN 'increasing'
            WHEN ts.recent_count < ts.older_count THEN 'decreasing'
            ELSE 'stable'
        END as trend_direction
    FROM training_stats ts
    ORDER BY ts.total_trainings DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    company_id UUID;
    audit_data JSONB;
BEGIN
    -- Gestion spéciale pour la table companies
    IF TG_TABLE_NAME = 'companies' THEN
        -- Pour companies, company_id = id de l'entreprise
        company_id := COALESCE(NEW.id, OLD.id);
    ELSE
        -- Pour toutes les autres tables, utiliser company_id
        IF TG_OP = 'DELETE' THEN
            company_id := OLD.company_id;
        ELSE
            company_id := NEW.company_id;
        END IF;
    END IF;

    -- Construction des données d'audit
    audit_data := jsonb_build_object(
        'operation', TG_OP,
        'table_name', TG_TABLE_NAME,
        'user_id', current_setting('app.current_user_id', true),
        'timestamp', NOW()
    );

    -- Ajouter les données selon l'opération
    IF TG_OP = 'DELETE' THEN
        audit_data := audit_data || jsonb_build_object('old_data', row_to_json(OLD));
    ELSE
        audit_data := audit_data || jsonb_build_object('new_data', row_to_json(NEW));
        IF TG_OP = 'UPDATE' THEN
            audit_data := audit_data || jsonb_build_object('old_data', row_to_json(OLD));
        END IF;
    END IF;

    -- Tentative d'insertion dans les logs d'audit (si la table existe)
    BEGIN
        INSERT INTO audit_logs (
            company_id,
            table_name,
            operation,
            audit_data,
            created_at
        ) VALUES (
            company_id,
            TG_TABLE_NAME,
            TG_OP,
            audit_data,
            NOW()
        );
    EXCEPTION
        WHEN undefined_table THEN
            -- Table audit_logs n'existe pas, ignorer silencieusement
            NULL;
        WHEN undefined_column THEN
            -- Colonne manquante, ignorer silencieusement
            NULL;
        WHEN others THEN
            -- Autres erreurs d'audit, ne pas bloquer l'opération principale
            RAISE WARNING 'Audit failed for table %: %', TG_TABLE_NAME, SQLERRM;
    END;

    -- Retourner la ligne appropriée
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_populate_budget_categories()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_country_code TEXT;
BEGIN
  -- Déterminer le pays de l'entreprise (à adapter selon votre structure)
  SELECT COALESCE(country_code, 'FR')
  INTO v_country_code
  FROM companies
  WHERE id = NEW.company_id;

  -- Créer les catégories automatiquement
  PERFORM initialize_budget_category_mappings(
    NEW.company_id,
    NEW.id,
    v_country_code
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_automatic_rfa(p_contract_id uuid, p_period_start date, p_period_end date, p_turnover_amount numeric)
 RETURNS TABLE(rfa_amount numeric, rfa_percentage numeric, calculation_details jsonb)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_contract contracts%ROWTYPE;
    v_rfa_amount DECIMAL(15,2) := 0;
    v_rfa_percentage DECIMAL(5,2) := 0;
    v_details JSONB := '{"tiers": []}';
    v_tier JSONB;
    v_remaining_amount DECIMAL(15,2);
    v_tier_amount DECIMAL(15,2);
    v_tier_rfa DECIMAL(15,2);
BEGIN
    -- Récupérer le contrat
    SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;

    IF NOT FOUND OR NOT v_contract.has_rfa THEN
        RETURN QUERY SELECT 0::DECIMAL(15,2), 0::DECIMAL(5,2), '{}'::JSONB;
        RETURN;
    END IF;

    -- Calcul selon le type
    IF v_contract.rfa_calculation_type = 'fixed_percent' THEN
        v_rfa_percentage := v_contract.rfa_base_percentage;
        v_rfa_amount := p_turnover_amount * v_rfa_percentage / 100;
        v_details := jsonb_build_object(
            'method', 'fixed_percent',
            'rate', v_rfa_percentage,
            'base_amount', p_turnover_amount
        );

    ELSIF v_contract.rfa_calculation_type = 'progressive' AND v_contract.rfa_tiers IS NOT NULL THEN
        v_remaining_amount := p_turnover_amount;

        -- Parcourir les paliers
        FOR v_tier IN SELECT * FROM jsonb_array_elements(v_contract.rfa_tiers)
        LOOP
            IF v_remaining_amount <= 0 THEN EXIT; END IF;

            -- Calculer le montant pour ce palier
            IF (v_tier ->> 'max_amount')::DECIMAL IS NULL THEN
                v_tier_amount := v_remaining_amount;
            ELSE
                v_tier_amount := LEAST(v_remaining_amount,
                                     (v_tier ->> 'max_amount')::DECIMAL - (v_tier ->> 'min_amount')::DECIMAL);
            END IF;

            v_tier_rfa := v_tier_amount * (v_tier ->> 'rate')::DECIMAL / 100;
            v_rfa_amount := v_rfa_amount + v_tier_rfa;

            -- Ajouter aux détails
            v_details := jsonb_set(
                v_details,
                '{tiers}',
                (v_details -> 'tiers') || jsonb_build_object(
                    'min_amount', v_tier ->> 'min_amount',
                    'max_amount', v_tier ->> 'max_amount',
                    'rate', v_tier ->> 'rate',
                    'tier_amount', v_tier_amount,
                    'tier_rfa', v_tier_rfa
                )
            );

            v_remaining_amount := v_remaining_amount - v_tier_amount;
        END LOOP;

        v_rfa_percentage := CASE WHEN p_turnover_amount > 0 THEN (v_rfa_amount / p_turnover_amount * 100) ELSE 0 END;
    END IF;

    RETURN QUERY SELECT v_rfa_amount, v_rfa_percentage, v_details;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_employee_engagement_score(p_company_id uuid)
 RETURNS TABLE(employee_id uuid, engagement_score numeric, factors jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        e.id as employee_id,
        (
            COALESCE(perf.avg_rating, 3.0) * 0.3 +
            COALESCE(training.completion_rate, 0.5) * 20 * 0.2 +
            CASE WHEN disc.recent_actions > 0 THEN 1.0 ELSE 5.0 END * 0.1 +
            COALESCE(skills.avg_score, 3.0) * 0.2 +
            CASE WHEN cp.recent_progression > 0 THEN 5.0 ELSE 3.0 END * 0.2
        )::DECIMAL(3,1) as engagement_score,
        jsonb_build_object(
            'performance_rating', COALESCE(perf.avg_rating, 3.0),
            'training_completion', COALESCE(training.completion_rate, 0.5),
            'disciplinary_score', CASE WHEN disc.recent_actions > 0 THEN 1.0 ELSE 5.0 END,
            'skills_average', COALESCE(skills.avg_score, 3.0),
            'career_progression', CASE WHEN cp.recent_progression > 0 THEN 'recent' ELSE 'none' END
        ) as factors
    FROM employees e
    LEFT JOIN (
        SELECT employee_id, AVG(overall_rating) as avg_rating
        FROM performance_reviews
        WHERE company_id = p_company_id AND review_date >= CURRENT_DATE - INTERVAL '2 years'
        GROUP BY employee_id
    ) perf ON e.id = perf.employee_id
    LEFT JOIN (
        SELECT employee_id,
               AVG(completion_percentage) / 100.0 as completion_rate
        FROM training_records
        WHERE company_id = p_company_id AND start_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY employee_id
    ) training ON e.id = training.employee_id
    LEFT JOIN (
        SELECT employee_id, COUNT(*) as recent_actions
        FROM disciplinary_actions
        WHERE company_id = p_company_id AND action_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY employee_id
    ) disc ON e.id = disc.employee_id
    LEFT JOIN (
        SELECT employee_id, AVG(current_score) as avg_score
        FROM skill_assessments
        WHERE company_id = p_company_id AND assessment_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY employee_id
    ) skills ON e.id = skills.employee_id
    LEFT JOIN (
        SELECT employee_id, COUNT(*) as recent_progression
        FROM career_progression
        WHERE company_id = p_company_id AND effective_date >= CURRENT_DATE - INTERVAL '2 years'
        AND progression_type IN ('promotion', 'lateral_move')
        GROUP BY employee_id
    ) cp ON e.id = cp.employee_id
    WHERE e.company_id = p_company_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_financial_health_score(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_liquidity_ratio DECIMAL(10,2) := 0;
    v_profitability_ratio DECIMAL(10,2) := 0;
    v_cash_balance DECIMAL(15,2) := 0;
    v_monthly_expenses DECIMAL(15,2) := 0;
    v_monthly_revenue DECIMAL(15,2) := 0;
    v_overall_score INTEGER := 0;
    v_liquidity_score INTEGER := 0;
    v_profitability_score INTEGER := 0;
    v_efficiency_score INTEGER := 0;
    v_growth_score INTEGER := 0;
    v_risk_score INTEGER := 0;
BEGIN
    -- Position de trésorerie
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_cash_balance
    FROM bank_accounts
    WHERE company_id = p_company_id AND is_active = true;

    -- Dépenses mensuelles moyennes
    SELECT COALESCE(AVG(monthly_expenses), 0)
    FROM (
        SELECT DATE_TRUNC('month', je.entry_date) as month,
               SUM(jel.debit_amount) as monthly_expenses
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE je.company_id = p_company_id
          AND coa.account_type = 'expense'
          AND je.entry_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', je.entry_date)
    ) t
    INTO v_monthly_expenses;

    -- CA mensuel moyen
    SELECT COALESCE(AVG(monthly_revenue), 0)
    FROM (
        SELECT DATE_TRUNC('month', invoice_date) as month,
               SUM(total_incl_tax) as monthly_revenue
        FROM invoices
        WHERE company_id = p_company_id
          AND status = 'paid'
          AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', invoice_date)
    ) t
    INTO v_monthly_revenue;

    -- Calcul des scores
    -- Score de liquidité (0-100)
    IF v_monthly_expenses > 0 THEN
        v_liquidity_ratio := v_cash_balance / v_monthly_expenses;
        v_liquidity_score := LEAST(100, GREATEST(0, (v_liquidity_ratio * 20)::INTEGER));
    ELSE
        v_liquidity_score := 50;
    END IF;

    -- Score de profitabilité (0-100)
    IF v_monthly_revenue > 0 THEN
        v_profitability_ratio := (v_monthly_revenue - v_monthly_expenses) / v_monthly_revenue;
        v_profitability_score := LEAST(100, GREATEST(0, (50 + v_profitability_ratio * 100)::INTEGER));
    ELSE
        v_profitability_score := 0;
    END IF;

    -- Scores par défaut pour les autres catégories
    v_efficiency_score := 75;
    v_growth_score := 65;
    v_risk_score := CASE
        WHEN v_liquidity_score >= 80 THEN 85
        WHEN v_liquidity_score >= 60 THEN 70
        WHEN v_liquidity_score >= 40 THEN 55
        ELSE 30
    END;

    -- Score global
    v_overall_score := (v_liquidity_score + v_profitability_score + v_efficiency_score + v_growth_score + v_risk_score) / 5;

    v_result := json_build_object(
        'overall_score', v_overall_score,
        'liquidity_score', v_liquidity_score,
        'profitability_score', v_profitability_score,
        'efficiency_score', v_efficiency_score,
        'growth_score', v_growth_score,
        'risk_score', v_risk_score,
        'sustainability_score', (v_overall_score + v_risk_score) / 2,
        'recommendations', CASE
            WHEN v_overall_score >= 80 THEN json_build_array('Excellente santé financière', 'Continuez sur cette voie')
            WHEN v_overall_score >= 60 THEN json_build_array('Bonne santé financière', 'Quelques améliorations possibles')
            WHEN v_overall_score >= 40 THEN json_build_array('Santé financière correcte', 'Surveillance recommandée')
            ELSE json_build_array('Attention requise', 'Plan d''action urgent à mettre en place')
        END,
        'critical_alerts', CASE
            WHEN v_liquidity_score < 30 THEN json_build_array('Risque de liquidité élevé')
            WHEN v_profitability_score < 30 THEN json_build_array('Rentabilité critique')
            ELSE json_build_array()
        END
    );

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_project_progress()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Mettre à jour la progression du projet basée sur les tâches
    UPDATE projects
    SET progress = (
        SELECT COALESCE(AVG(progress), 0)
        FROM project_tasks
        WHERE project_id = NEW.project_id
        AND status != 'cancelled'
    )
    WHERE id = NEW.project_id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_purchase_totals(p_purchase_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_subtotal DECIMAL(15,2) := 0;
    v_tax_amount DECIMAL(15,2) := 0;
    v_total DECIMAL(15,2) := 0;
    v_purchase_discount DECIMAL(5,2) := 0;
    v_discount_amount DECIMAL(15,2) := 0;
BEGIN
    -- Obtenir la remise de la commande
    SELECT COALESCE(discount_rate, 0) INTO v_purchase_discount
    FROM purchases WHERE id = p_purchase_id;

    -- Calculer le sous-total des lignes
    SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
    FROM purchase_items
    WHERE purchase_id = p_purchase_id;

    -- Calculer la remise sur le sous-total
    v_discount_amount := ROUND(v_subtotal * v_purchase_discount / 100, 2);

    -- Calculer le montant après remise
    v_subtotal := v_subtotal - v_discount_amount;

    -- Calculer la TVA sur le montant après remise
    SELECT COALESCE(SUM(
        ROUND((line_total * (1 - v_purchase_discount/100)) * tax_rate / 100, 2)
    ), 0) INTO v_tax_amount
    FROM purchase_items
    WHERE purchase_id = p_purchase_id;

    -- Total final
    v_total := v_subtotal + v_tax_amount;

    RETURN jsonb_build_object(
        'subtotal_amount', v_subtotal,
        'tax_amount', v_tax_amount,
        'discount_amount', v_discount_amount,
        'total_amount', v_total
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_access_feature(p_user_id uuid, p_feature_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_subscription RECORD;
  v_limit INTEGER;
  v_current_usage INTEGER;
BEGIN
  SELECT s.*, sp.features
  INTO v_subscription
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT (v_subscription.features ? p_feature_name) THEN
    RETURN FALSE;
  END IF;

  SELECT limit_value, current_usage
  INTO v_limit, v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_name = p_feature_name;

  IF v_limit IS NULL OR v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN COALESCE(v_current_usage, 0) < v_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_create_trial(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    existing_subscription_count INTEGER;
BEGIN
    -- Vérifier s'il n'y a pas déjà un essai ou un abonnement actif
    SELECT COUNT(*)
    INTO existing_subscription_count
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing');

    -- Un utilisateur peut créer un essai s'il n'a pas d'abonnement actif
    RETURN existing_subscription_count = 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_delete_account(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_companies_as_sole_owner JSONB := '[]';
    v_result JSON;
    company_record RECORD;
BEGIN
    -- Trouver les entreprises où l'utilisateur est le seul propriétaire
    FOR company_record IN
        SELECT c.id, c.name,
               COUNT(uc2.user_id) FILTER (WHERE uc2.role = 'owner') as owner_count
        FROM companies c
        JOIN user_companies uc ON c.id = uc.company_id
        LEFT JOIN user_companies uc2 ON c.id = uc2.company_id AND uc2.role = 'owner' AND uc2.is_active = true
        WHERE uc.user_id = p_user_id AND uc.role = 'owner' AND uc.is_active = true
        GROUP BY c.id, c.name
        HAVING COUNT(uc2.user_id) FILTER (WHERE uc2.role = 'owner') = 1
    LOOP
        v_companies_as_sole_owner := v_companies_as_sole_owner || jsonb_build_object(
            'company_id', company_record.id,
            'company_name', company_record.name,
            'owner_count', company_record.owner_count
        );
    END LOOP;

    v_result := json_build_object(
        'can_delete', jsonb_array_length(v_companies_as_sole_owner) = 0,
        'companies_as_sole_owner', v_companies_as_sole_owner,
        'requires_ownership_transfer', jsonb_array_length(v_companies_as_sole_owner) > 0,
        'message', CASE
            WHEN jsonb_array_length(v_companies_as_sole_owner) = 0
            THEN 'Account can be deleted safely'
            ELSE 'Ownership transfer required for ' || jsonb_array_length(v_companies_as_sole_owner) || ' companies'
        END
    );

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_subscription(p_user_id uuid, p_subscription_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE subscriptions
  SET
    cancel_at_period_end = TRUE,
    updated_at = now()
  WHERE id = p_subscription_id
    AND user_id = p_user_id
    AND status IN ('active', 'trialing');

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_trial(p_user_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    trial_subscription_id UUID;
BEGIN
    -- Trouver l'abonnement d'essai actif
    SELECT id INTO trial_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'trialing';

    IF trial_subscription_id IS NULL THEN
        RETURN 'NO_ACTIVE_TRIAL';
    END IF;

    -- Annuler l'abonnement
    UPDATE subscriptions
    SET
        status = 'canceled',
        canceled_at = NOW(),
        cancel_reason = p_reason,
        updated_at = NOW()
    WHERE id = trial_subscription_id;

    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error canceling trial: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_index_usage()
 RETURNS TABLE(table_name text, index_name text, index_size text, scans bigint, tuples_read bigint, tuples_fetched bigint, efficiency text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename as table_name,
        indexrelname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CASE
            WHEN idx_scan = 0 THEN '❌ UNUSED'
            WHEN idx_scan < 100 THEN '⚠️ LOW USAGE'
            WHEN idx_tup_read > idx_tup_fetch * 10 THEN '⚠️ INEFFICIENT'
            ELSE '✅ EFFICIENT'
        END as efficiency
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('customers', 'suppliers', 'invoices', 'purchases',
                      'subscriptions', 'crm_clients', 'crm_opportunities', 'crm_activities')
    ORDER BY idx_scan DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_rls_health()
 RETURNS TABLE(table_name text, rls_enabled boolean, policy_count integer, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.tablename::text,
        t.rowsecurity,
        COALESCE(p.policy_count, 0)::integer,
        CASE
            WHEN NOT t.rowsecurity THEN '🚨 RLS DISABLED'
            WHEN COALESCE(p.policy_count, 0) = 0 THEN '⚠️ NO POLICIES'
            WHEN COALESCE(p.policy_count, 0) < 4 THEN '⚠️ INCOMPLETE POLICIES'
            ELSE '✅ HEALTHY'
        END::text
    FROM pg_tables t
    LEFT JOIN (
        SELECT schemaname, tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
    ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('customers', 'suppliers', 'invoices', 'purchases',
                        'subscriptions', 'crm_clients', 'crm_opportunities', 'crm_activities')
    ORDER BY t.tablename;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_stock_alerts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_alert_exists BOOLEAN;
BEGIN
    -- Vérifier stock faible
    IF NEW.quantity_on_hand <= NEW.minimum_stock AND NEW.minimum_stock > 0 THEN
        -- Vérifier si une alerte existe déjà
        SELECT EXISTS (
            SELECT 1 FROM stock_alerts
            WHERE product_id = NEW.product_id
            AND warehouse_id = NEW.warehouse_id
            AND alert_type = 'low_stock'
            AND is_active = true
        ) INTO v_alert_exists;

        IF NOT v_alert_exists THEN
            INSERT INTO stock_alerts (
                product_id, warehouse_id, company_id,
                alert_type, severity, current_stock, threshold_stock
            ) VALUES (
                NEW.product_id, NEW.warehouse_id, NEW.company_id,
                'low_stock',
                CASE WHEN NEW.quantity_on_hand = 0 THEN 'critical' ELSE 'high' END,
                NEW.quantity_on_hand, NEW.minimum_stock
            );
        END IF;
    END IF;

    -- Vérifier rupture de stock
    IF NEW.quantity_on_hand = 0 THEN
        SELECT EXISTS (
            SELECT 1 FROM stock_alerts
            WHERE product_id = NEW.product_id
            AND warehouse_id = NEW.warehouse_id
            AND alert_type = 'out_of_stock'
            AND is_active = true
        ) INTO v_alert_exists;

        IF NOT v_alert_exists THEN
            INSERT INTO stock_alerts (
                product_id, warehouse_id, company_id,
                alert_type, severity, current_stock, threshold_stock
            ) VALUES (
                NEW.product_id, NEW.warehouse_id, NEW.company_id,
                'out_of_stock', 'critical', 0, 0
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id uuid, p_company_id uuid, p_resource text, p_action text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_perm RECORD;
    has_permission BOOLEAN := false;
BEGIN
    -- Récupérer les permissions utilisateur
    SELECT * INTO user_perm
    FROM user_permissions
    WHERE user_id = p_user_id
    AND company_id = p_company_id
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > NOW());

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Vérifier les permissions dans le JSON
    SELECT COALESCE(
        (user_perm.permissions->>p_resource)::JSONB ? p_action,
        user_perm.role = 'owner',
        false
    ) INTO has_permission;

    -- Logger l'événement de vérification de permission
    PERFORM log_audit_event(
        'PERMISSION_CHECK',
        'user_permissions',
        user_perm.id::TEXT,
        jsonb_build_object('resource', p_resource, 'action', p_action, 'result', has_permission),
        NULL,
        p_user_id,
        p_company_id,
        'high'
    );

    RETURN has_permission;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_expired_report_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM report_cache WHERE expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.convert_trial_to_paid(p_user_id uuid, p_new_plan_id text, p_stripe_subscription_id text DEFAULT NULL::text, p_stripe_customer_id text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    trial_subscription_id UUID;
    plan_exists BOOLEAN;
BEGIN
    -- Vérifier que le plan existe
    SELECT EXISTS(SELECT 1 FROM subscription_plans WHERE id = p_new_plan_id)
    INTO plan_exists;

    IF NOT plan_exists THEN
        RETURN 'PLAN_NOT_FOUND';
    END IF;

    -- Trouver l'abonnement d'essai actif
    SELECT id INTO trial_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'trialing';

    IF trial_subscription_id IS NULL THEN
        RETURN 'NO_ACTIVE_TRIAL';
    END IF;

    -- Mettre à jour l'abonnement
    UPDATE subscriptions
    SET
        plan_id = p_new_plan_id,
        status = 'active',
        stripe_subscription_id = p_stripe_subscription_id,
        stripe_customer_id = p_stripe_customer_id,
        trial_end = NULL,
        updated_at = NOW()
    WHERE id = trial_subscription_id;

    RETURN 'SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error converting trial to paid: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_audit_trail(p_table_name text, p_record_id text, p_action text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        table_name, record_id, event_type,
        old_values, new_values, company_id, created_at
    )
    VALUES (
        p_table_name, p_record_id, p_action,
        p_old_values, p_new_values, p_company_id, NOW()
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_basic_accounts(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_count INTEGER := 0;
    basic_accounts TEXT[][] := ARRAY[
        ['101000', 'Capital social', 'equity', '1'],
        ['120000', 'Résultat de l''exercice', 'equity', '1'],
        ['401000', 'Fournisseurs', 'liability', '4'],
        ['411000', 'Clients', 'asset', '4'],
        ['445660', 'TVA déductible', 'asset', '4'],
        ['445710', 'TVA collectée', 'liability', '4'],
        ['512000', 'Banque', 'asset', '5'],
        ['530000', 'Caisse', 'asset', '5'],
        ['601000', 'Achats', 'expense', '6'],
        ['701000', 'Ventes', 'revenue', '7']
    ];
    account_data TEXT[];
BEGIN
    FOREACH account_data SLICE 1 IN ARRAY basic_accounts
    LOOP
        INSERT INTO accounts (
            company_id,
            account_number,
            account_name,
            account_type,
            account_class,
            normal_balance
        ) VALUES (
            p_company_id,
            account_data[1],
            account_data[2],
            account_data[3],
            account_data[4]::INTEGER,
            CASE
                WHEN account_data[3] IN ('asset', 'expense') THEN 'debit'
                ELSE 'credit'
            END
        ) ON CONFLICT (company_id, account_number) DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_budget_with_standard_categories(p_company_id uuid, p_budget_year integer, p_budget_name text, p_country_code text DEFAULT 'FR'::text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_budget_id UUID;
  v_categories_count INTEGER;
BEGIN
  -- Créer le budget
  INSERT INTO budgets (
    company_id,
    budget_year,
    name,
    description,
    version,
    status,
    start_date,
    end_date
  )
  VALUES (
    p_company_id,
    p_budget_year,
    p_budget_name,
    'Budget avec catégories standards ' || p_country_code,
    1,
    'draft',
    make_date(p_budget_year, 1, 1),
    make_date(p_budget_year, 12, 31)
  )
  RETURNING id INTO v_budget_id;

  -- Initialiser les catégories et mappings
  v_categories_count := initialize_budget_category_mappings(
    p_company_id,
    v_budget_id,
    p_country_code
  );

  -- Log du nombre de catégories créées
  RAISE NOTICE 'Budget créé avec % catégories standards', v_categories_count;

  RETURN v_budget_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_title text, p_message text, p_type text DEFAULT 'info'::text, p_category text DEFAULT 'general'::text, p_link text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_expires_in_days integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id);

    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
  END IF;

  IF NOT v_preferences.in_app_enabled THEN
    RETURN NULL;
  END IF;

  IF (p_category = 'system' AND NOT v_preferences.system_notifications) OR
     (p_category = 'billing' AND NOT v_preferences.billing_notifications) OR
     (p_category = 'feature' AND NOT v_preferences.feature_notifications) OR
     (p_category = 'security' AND NOT v_preferences.security_notifications) OR
     (p_category = 'general' AND NOT v_preferences.general_notifications) THEN
    RETURN NULL;
  END IF;

  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := now() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    link,
    metadata,
    expires_at
  )
  VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_category,
    p_link,
    p_metadata,
    v_expires_at
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_onboarding_session(p_company_id uuid, p_user_id uuid, p_initial_data jsonb DEFAULT '{}'::jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_session_token TEXT;
BEGIN
    -- Générer token unique
    v_session_token := gen_random_uuid()::text;

    -- Créer la session
    INSERT INTO onboarding_sessions (
        company_id,
        user_id,
        session_token,
        initial_data
    ) VALUES (
        p_company_id,
        p_user_id,
        v_session_token,
        p_initial_data
    );

    RETURN v_session_token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_trial_subscription(p_user_id uuid, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_existing_subscription UUID;
  v_trial_plan_id TEXT := 'trial';
  v_trial_days INTEGER := 14;
  v_new_subscription_id UUID;
BEGIN
  SELECT id INTO v_existing_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing', 'past_due');

  IF FOUND THEN
    RETURN 'ALREADY_EXISTS';
  END IF;

  INSERT INTO subscriptions (
    user_id,
    company_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_end
  )
  VALUES (
    p_user_id,
    p_company_id,
    v_trial_plan_id,
    'trialing',
    now(),
    now() + INTERVAL '1 year',
    now() + (v_trial_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_new_subscription_id;

  RETURN v_new_subscription_id::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur création abonnement essai: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.daily_security_report()
 RETURNS TABLE(report_line text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    rls_issues integer;
    unused_indexes integer;
    total_tables integer;
BEGIN
    -- Compter les problèmes RLS
    SELECT COUNT(*) INTO rls_issues
    FROM public.check_rls_health()
    WHERE status NOT LIKE '✅%';

    -- Compter les index inutilisés
    SELECT COUNT(*) INTO unused_indexes
    FROM public.check_index_usage()
    WHERE efficiency = '❌ UNUSED';

    -- Total des tables surveillées
    SELECT 9 INTO total_tables;

    RETURN QUERY VALUES
        ('============================================'),
        ('CASSKAI - RAPPORT SÉCURITÉ QUOTIDIEN'),
        ('============================================'),
        ('Date: ' || CURRENT_DATE::text),
        ('Tables surveillées: ' || total_tables::text || '/9'),
        ('Problèmes RLS: ' || rls_issues::text),
        ('Index inutilisés: ' || unused_indexes::text),
        (''),
        ('DÉTAIL RLS:'),
        ('============================================');

    -- Ajouter les détails RLS
    RETURN QUERY
    SELECT table_name || ': ' || status
    FROM public.check_rls_health();

    RETURN QUERY VALUES
        (''),
        ('PERFORMANCE INDEX:'),
        ('============================================');

    -- Ajouter les détails des index
    RETURN QUERY
    SELECT index_name || ' (' || table_name || '): ' || efficiency || ' - ' || scans::text || ' scans'
    FROM public.check_index_usage()
    WHERE efficiency != '✅ EFFICIENT'
    ORDER BY scans DESC;

    RETURN QUERY VALUES
        (''),
        ('============================================'),
        (CASE
            WHEN rls_issues = 0 AND unused_indexes < 3 THEN 'STATUT: 🟢 SYSTÈME SAIN'
            WHEN rls_issues > 0 THEN 'STATUT: 🔴 ACTION REQUISE (RLS)'
            ELSE 'STATUT: 🟡 OPTIMISATION RECOMMANDÉE'
        END);

END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_client()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM crm_clients WHERE id = OLD.id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_client_from_view()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM crm_clients WHERE id = OLD.id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_commercial_action()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM crm_activities WHERE id = OLD.id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_opportunity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM crm_opportunities WHERE id = OLD.id;
    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.detect_suspicious_access()
 RETURNS TABLE(event_time timestamp without time zone, user_id uuid, table_accessed text, operation text, row_count bigint, risk_level text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Cette fonction nécessiterait des logs d'audit activés
    -- Pour l'instant, retourne une structure vide
    RETURN QUERY
    SELECT
        NOW()::timestamp,
        auth.uid(),
        'example_table'::text,
        'SELECT'::text,
        0::bigint,
        '✅ NO SUSPICIOUS ACTIVITY'::text
    LIMIT 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
 RETURNS TABLE(user_id uuid, suspicious_events integer, risk_score integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        se.user_id,
        COUNT(*)::INTEGER as suspicious_events,
        CASE
            WHEN COUNT(*) > 10 THEN 100
            WHEN COUNT(*) > 5 THEN 75
            WHEN COUNT(*) > 2 THEN 50
            ELSE 25
        END::INTEGER as risk_score
    FROM security_events se
    WHERE se.event_timestamp >= NOW() - INTERVAL '1 hour'
    AND se.severity_level IN ('critical', 'warning')
    GROUP BY se.user_id
    HAVING COUNT(*) >= 2
    ORDER BY suspicious_events DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enable_company_feature(p_company_id uuid, p_feature_name text, p_configuration jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(success boolean, message text, feature_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_feature_record RECORD;
    v_feature_id UUID;
    v_user_plan TEXT := 'free'; -- À adapter selon votre logique de plan
BEGIN
    -- Vérifier que la feature existe et est active
    SELECT * INTO v_feature_record
    FROM available_features
    WHERE feature_name = p_feature_name
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Feature not found or inactive', NULL;
        RETURN;
    END IF;

    -- Vérifier les prérequis de plan
    IF v_feature_record.requires_plan != 'free' AND v_user_plan = 'free' THEN
        RETURN QUERY SELECT false, 'Requires premium plan', NULL;
        RETURN;
    END IF;

    -- Vérifier si la feature est déjà activée
    SELECT id INTO v_feature_id
    FROM company_features
    WHERE company_id = p_company_id
    AND feature_name = p_feature_name;

    IF FOUND THEN
        -- Mettre à jour la feature existante
        UPDATE company_features SET
            is_enabled = true,
            configuration = p_configuration,
            updated_at = NOW()
        WHERE id = v_feature_id;

        RETURN QUERY SELECT true, 'Feature updated successfully', v_feature_id;
    ELSE
        -- Créer une nouvelle feature
        INSERT INTO company_features (
            company_id,
            feature_name,
            feature_category,
            is_enabled,
            configuration,
            license_tier,
            usage_limit,
            reset_period
        ) VALUES (
            p_company_id,
            p_feature_name,
            v_feature_record.category,
            true,
            p_configuration,
            v_feature_record.requires_plan,
            v_feature_record.default_usage_limit,
            v_feature_record.default_reset_period
        )
        RETURNING id INTO v_feature_id;

        RETURN QUERY SELECT true, 'Feature enabled successfully', v_feature_id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enable_company_module_advanced(p_company_id uuid, p_module_key text, p_custom_settings jsonb DEFAULT '{}'::jsonb, p_access_level text DEFAULT 'standard'::text, p_user_limit integer DEFAULT NULL::integer, p_storage_quota_gb integer DEFAULT 10)
 RETURNS TABLE(success boolean, message text, module_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_module_id UUID;
    v_catalog_record RECORD;
BEGIN
    -- Vérifier que le module existe dans le catalogue
    SELECT * INTO v_catalog_record
    FROM module_catalog
    WHERE module_key = p_module_key
    AND is_active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Module not found in catalog', NULL;
        RETURN;
    END IF;

    -- Vérifier s'il existe déjà
    SELECT id INTO v_module_id
    FROM company_modules
    WHERE company_id = p_company_id
    AND module_key = p_module_key;

    IF FOUND THEN
        -- Mettre à jour le module existant
        UPDATE company_modules SET
            is_enabled = true,
            custom_settings = p_custom_settings,
            access_level = p_access_level,
            user_limit = p_user_limit,
            storage_quota_gb = p_storage_quota_gb,
            updated_at = NOW()
        WHERE id = v_module_id;

        RETURN QUERY SELECT true, 'Module updated successfully', v_module_id;
    ELSE
        -- Créer un nouveau module avec configuration avancée
        INSERT INTO company_modules (
            company_id,
            module_key,
            module_name,
            is_enabled,
            custom_settings,
            access_level,
            license_type,
            user_limit,
            storage_quota_gb,
            display_order
        ) VALUES (
            p_company_id,
            p_module_key,
            v_catalog_record.display_name_fr,
            true,
            p_custom_settings,
            p_access_level,
            v_catalog_record.requires_plan,
            p_user_limit,
            p_storage_quota_gb,
            v_catalog_record.sort_order
        )
        RETURNING id INTO v_module_id;

        RETURN QUERY SELECT true, 'Module enabled successfully', v_module_id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text, p_key_name text DEFAULT 'default_data_key'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Récupérer la clé de chiffrement
    SELECT encrypted_key INTO encryption_key
    FROM encryption_keys
    WHERE key_name = p_key_name AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Encryption key not found or inactive: %', p_key_name;
    END IF;

    -- Incrémenter le compteur d'usage
    UPDATE encryption_keys
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE key_name = p_key_name;

    -- Retourner la donnée chiffrée (simulation - en production, utiliser une vraie clé)
    RETURN encode(digest(p_data || encryption_key, 'sha256'), 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_old_invitations()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE company_invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_trials()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mettre à jour les essais expirés
    WITH expired_trials AS (
        UPDATE subscriptions
        SET
            status = 'expired',
            updated_at = NOW()
        WHERE status = 'trialing'
        AND trial_end < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO expired_count FROM expired_trials;

    RETURN expired_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error expiring trials: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_balance_sheet(company_id_param uuid, end_date_param date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
    WITH account_balances AS (
        -- Calculer les soldes de chaque compte jusqu'à la date donnée
        SELECT
            a.id,
            a.account_number,
            a.name,
            a.type,
            a.class,
            COALESCE(SUM(jei.debit_amount - jei.credit_amount), 0) as balance
        FROM accounts a
        LEFT JOIN journal_entry_items jei ON jei.account_id = a.id
        LEFT JOIN journal_entries je ON je.id = jei.journal_entry_id
        WHERE a.company_id = company_id_param
          AND a.is_active = true
          AND je.status = 'posted'
          AND je.entry_date <= end_date_param
        GROUP BY a.id, a.account_number, a.name, a.type, a.class
    ),
    balance_sheet_data AS (
        SELECT
            -- ACTIF CIRCULANT
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '512%' THEN ab.balance ELSE 0 END) as cash_and_equivalents,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '411%' THEN ab.balance ELSE 0 END) as accounts_receivable,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '3%' THEN ab.balance ELSE 0 END) as inventory,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '486%' THEN ab.balance ELSE 0 END) as prepaid_expenses,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 1 AND 5 AND ab.account_number NOT LIKE '512%' AND ab.account_number NOT LIKE '411%' AND ab.account_number NOT LIKE '3%' AND ab.account_number NOT LIKE '486%' THEN ab.balance ELSE 0 END) as other_current_assets,

            -- ACTIF IMMOBILISÉ
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number LIKE '21%' THEN ab.balance ELSE 0 END) as property_plant_equipment,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number LIKE '20%' THEN ab.balance ELSE 0 END) as intangible_assets,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number LIKE '25%' THEN ab.balance ELSE 0 END) as investments,
            SUM(CASE WHEN ab.type = 'asset' AND ab.class BETWEEN 2 AND 3 AND ab.account_number NOT LIKE '21%' AND ab.account_number NOT LIKE '20%' AND ab.account_number NOT LIKE '25%' THEN ab.balance ELSE 0 END) as other_non_current_assets,

            -- PASSIF CIRCULANT
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '401%' THEN ab.balance ELSE 0 END) as accounts_payable,
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '16%' THEN ab.balance ELSE 0 END) as short_term_debt,
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number LIKE '42%' THEN ab.balance ELSE 0 END) as accrued_expenses,
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 1 AND 5 AND ab.account_number NOT LIKE '401%' AND ab.account_number NOT LIKE '16%' AND ab.account_number NOT LIKE '42%' THEN ab.balance ELSE 0 END) as other_current_liabilities,

            -- PASSIF NON COURANT
            SUM(CASE WHEN ab.type = 'liability' AND ab.class BETWEEN 2 AND 3 THEN ab.balance ELSE 0 END) as long_term_debt,

            -- CAPITAUX PROPRES
            SUM(CASE WHEN ab.type = 'equity' THEN ab.balance ELSE 0 END) as equity
        FROM account_balances ab
    )
    SELECT jsonb_build_object(
        'assets', jsonb_build_object(
            'current_assets', jsonb_build_object(
                'cash_and_equivalents', cash_and_equivalents,
                'accounts_receivable', accounts_receivable,
                'inventory', inventory,
                'prepaid_expenses', prepaid_expenses,
                'other_current_assets', other_current_assets,
                'total_current_assets', (cash_and_equivalents + accounts_receivable + inventory + prepaid_expenses + other_current_assets)
            ),
            'non_current_assets', jsonb_build_object(
                'property_plant_equipment', property_plant_equipment,
                'intangible_assets', intangible_assets,
                'investments', investments,
                'other_non_current_assets', other_non_current_assets,
                'total_non_current_assets', (property_plant_equipment + intangible_assets + investments + other_non_current_assets)
            ),
            'total_assets', (cash_and_equivalents + accounts_receivable + inventory + prepaid_expenses + other_current_assets + property_plant_equipment + intangible_assets + investments + other_non_current_assets)
        ),
        'liabilities', jsonb_build_object(
            'current_liabilities', jsonb_build_object(
                'accounts_payable', accounts_payable,
                'short_term_debt', short_term_debt,
                'accrued_expenses', accrued_expenses,
                'other_current_liabilities', other_current_liabilities,
                'total_current_liabilities', (accounts_payable + short_term_debt + accrued_expenses + other_current_liabilities)
            ),
            'non_current_liabilities', jsonb_build_object(
                'long_term_debt', long_term_debt,
                'total_non_current_liabilities', long_term_debt
            ),
            'equity', jsonb_build_object(
                'equity', equity,
                'total_equity', equity
            ),
            'total_liabilities_and_equity', (accounts_payable + short_term_debt + accrued_expenses + other_current_liabilities + long_term_debt + equity)
        )
    ) as balance_sheet
    FROM balance_sheet_data;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_cash_flow_forecast(p_company_id uuid, p_months_ahead integer DEFAULT 12)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_monthly_data JSON[];
    v_current_balance DECIMAL(15,2) := 0;
    v_avg_monthly_income DECIMAL(15,2) := 0;
    v_avg_monthly_expenses DECIMAL(15,2) := 0;
    v_month_date DATE;
    v_projected_balance DECIMAL(15,2);
    i INTEGER;
BEGIN
    -- Position actuelle
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_current_balance
    FROM bank_accounts
    WHERE company_id = p_company_id AND is_active = true;

    -- Revenus mensuels moyens (6 derniers mois)
    SELECT COALESCE(AVG(monthly_revenue), 0)
    FROM (
        SELECT SUM(total_incl_tax) as monthly_revenue
        FROM invoices
        WHERE company_id = p_company_id
          AND status = 'paid'
          AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', invoice_date)
    ) t
    INTO v_avg_monthly_income;

    -- Dépenses mensuelles moyennes (6 derniers mois)
    SELECT COALESCE(AVG(monthly_expenses), 0)
    FROM (
        SELECT SUM(jel.debit_amount) as monthly_expenses
        FROM journal_entry_lines jel
        JOIN journal_entries je ON je.id = jel.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jel.account_id
        WHERE je.company_id = p_company_id
          AND coa.account_type = 'expense'
          AND je.entry_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', je.entry_date)
    ) t
    INTO v_avg_monthly_expenses;

    -- Génération des prévisions
    v_monthly_data := ARRAY[]::JSON[];
    v_projected_balance := v_current_balance;

    FOR i IN 1..p_months_ahead LOOP
        v_month_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        v_projected_balance := v_projected_balance + v_avg_monthly_income - v_avg_monthly_expenses;

        v_monthly_data := v_monthly_data || json_build_object(
            'month', TO_CHAR(v_month_date, 'YYYY-MM'),
            'projected_income', v_avg_monthly_income,
            'projected_expenses', v_avg_monthly_expenses,
            'net_cash_flow', v_avg_monthly_income - v_avg_monthly_expenses,
            'projected_balance', v_projected_balance,
            'confidence_level', CASE
                WHEN i <= 3 THEN 85
                WHEN i <= 6 THEN 70
                ELSE 55
            END
        );
    END LOOP;

    v_result := array_to_json(v_monthly_data);

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_cash_flow_statement(company_id_param uuid, start_date_param date, end_date_param date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
    WITH cash_flow_data AS (
        SELECT
            -- FLUX DE TRÉSORERIE D'EXPLOITATION
            SUM(CASE WHEN account_number LIKE '512%' AND jei.debit_amount > 0 THEN jei.debit_amount ELSE 0 END) -
            SUM(CASE WHEN account_number LIKE '512%' AND jei.credit_amount > 0 THEN jei.credit_amount ELSE 0 END) as operating_cash_flow,

            -- FLUX DE TRÉSORERIE D'INVESTISSEMENT
            SUM(CASE WHEN account_number LIKE '21%' AND jei.debit_amount > 0 THEN jei.debit_amount ELSE 0 END) -
            SUM(CASE WHEN account_number LIKE '21%' AND jei.credit_amount > 0 THEN jei.credit_amount ELSE 0 END) as investing_cash_flow,

            -- FLUX DE TRÉSORERIE DE FINANCEMENT
            SUM(CASE WHEN account_number LIKE '101%' AND jei.debit_amount > 0 THEN jei.debit_amount ELSE 0 END) -
            SUM(CASE WHEN account_number LIKE '101%' AND jei.credit_amount > 0 THEN jei.credit_amount ELSE 0 END) as financing_cash_flow
        FROM journal_entry_items jei
        JOIN journal_entries je ON je.id = jei.journal_entry_id
        JOIN accounts a ON a.id = jei.account_id
        WHERE a.company_id = company_id_param
          AND je.status = 'posted'
          AND je.entry_date BETWEEN start_date_param AND end_date_param
    )
    SELECT jsonb_build_object(
        'operating_activities', jsonb_build_object(
            'net_cash_from_operating_activities', operating_cash_flow
        ),
        'investing_activities', jsonb_build_object(
            'net_cash_from_investing_activities', investing_cash_flow
        ),
        'financing_activities', jsonb_build_object(
            'net_cash_from_financing_activities', financing_cash_flow
        ),
        'net_cash_flow', (operating_cash_flow + investing_cash_flow + financing_cash_flow)
    ) as cash_flow_statement
    FROM cash_flow_data;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_compliance_report(p_company_id uuid, p_report_type text, p_period_start date, p_period_end date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    report_id UUID;
    audit_count INTEGER;
    security_events_count INTEGER;
    report_data JSONB;
BEGIN
    -- Compter les événements d'audit
    SELECT COUNT(*) INTO audit_count
    FROM audit_logs
    WHERE company_id = p_company_id
    AND event_timestamp BETWEEN p_period_start AND p_period_end;

    -- Compter les événements de sécurité
    SELECT COUNT(*) INTO security_events_count
    FROM security_events
    WHERE company_id = p_company_id
    AND event_timestamp BETWEEN p_period_start AND p_period_end;

    -- Construire les données du rapport
    report_data := jsonb_build_object(
        'audit_events', audit_count,
        'security_events', security_events_count,
        'period', jsonb_build_object(
            'start', p_period_start,
            'end', p_period_end
        ),
        'generated_at', NOW()
    );

    -- Créer le rapport
    INSERT INTO compliance_reports (
        report_type, report_name, company_id,
        period_start, period_end,
        report_data, total_records_analyzed,
        generated_by
    ) VALUES (
        p_report_type,
        CONCAT(p_report_type, ' - ', p_period_start, ' to ', p_period_end),
        p_company_id,
        p_period_start, p_period_end,
        report_data, audit_count + security_events_count,
        auth.uid()
    ) RETURNING id INTO report_id;

    RETURN report_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_income_statement(company_id_param uuid, start_date_param date, end_date_param date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
    WITH account_balances AS (
        SELECT
            a.id,
            a.account_number,
            a.name,
            a.type,
            a.class,
            COALESCE(SUM(jei.debit_amount - jei.credit_amount), 0) as balance
        FROM accounts a
        LEFT JOIN journal_entry_items jei ON jei.account_id = a.id
        LEFT JOIN journal_entries je ON je.id = jei.journal_entry_id
        WHERE a.company_id = company_id_param
          AND a.is_active = true
          AND je.status = 'posted'
          AND je.entry_date BETWEEN start_date_param AND end_date_param
        GROUP BY a.id, a.account_number, a.name, a.type, a.class
    ),
    income_statement_data AS (
        SELECT
            -- PRODUITS D'EXPLOITATION
            SUM(CASE WHEN ab.type = 'revenue' AND ab.account_number LIKE '70%' THEN ab.balance ELSE 0 END) as sales_revenue,
            SUM(CASE WHEN ab.type = 'revenue' AND ab.account_number LIKE '71%' THEN ab.balance ELSE 0 END) as service_revenue,
            SUM(CASE WHEN ab.type = 'revenue' AND ab.account_number NOT LIKE '70%' AND ab.account_number NOT LIKE '71%' THEN ab.balance ELSE 0 END) as other_revenue,

            -- CHARGES D'EXPLOITATION
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '60%' THEN ab.balance ELSE 0 END) as purchases,
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '61%' THEN ab.balance ELSE 0 END) as external_services,
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '62%' THEN ab.balance ELSE 0 END) as personnel_expenses,
            SUM(CASE WHEN ab.type = 'expense' AND ab.account_number LIKE '63%' THEN ab.balance ELSE 0 END) as other_expenses,

            -- RÉSULTAT D'EXPLOITATION
            SUM(CASE WHEN ab.type = 'revenue' THEN ab.balance ELSE 0 END) - SUM(CASE WHEN ab.type = 'expense' THEN ab.balance ELSE 0 END) as operating_profit
        FROM account_balances ab
    )
    SELECT jsonb_build_object(
        'revenue', jsonb_build_object(
            'sales_revenue', sales_revenue,
            'service_revenue', service_revenue,
            'other_revenue', other_revenue,
            'total_revenue', (sales_revenue + service_revenue + other_revenue)
        ),
        'expenses', jsonb_build_object(
            'purchases', purchases,
            'external_services', external_services,
            'personnel_expenses', personnel_expenses,
            'other_expenses', other_expenses,
            'total_expenses', (purchases + external_services + personnel_expenses + other_expenses)
        ),
        'profit', jsonb_build_object(
            'operating_profit', operating_profit,
            'net_profit', operating_profit
        )
    ) as income_statement
    FROM income_statement_data;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invoice_number_custom(p_company_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
    v_invoice_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Récupérer le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(invoice_number FROM position('-' IN invoice_number) + 1) AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM invoices
    WHERE company_id = p_company_id
        AND invoice_number LIKE 'FAC' || v_year || '-%';

    v_invoice_number := 'FAC' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_invoice_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_purchase_number(p_company_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_year TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    v_sequence INTEGER;
    v_number TEXT;
BEGIN
    -- Obtenir le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM 'ACH' || v_year || '-(\d+)') AS INTEGER)), 0) + 1
    INTO v_sequence
    FROM purchases
    WHERE company_id = p_company_id
    AND purchase_number LIKE 'ACH' || v_year || '-%';

    -- Générer le numéro formaté
    v_number := 'ACH' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_quote_number(p_company_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
    v_quote_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Récupérer le prochain numéro de séquence pour l'année
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(quote_number FROM position('-' IN quote_number) + 1) AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM quotes
    WHERE company_id = p_company_id
        AND quote_number LIKE 'DEV' || v_year || '-%';

    v_quote_number := 'DEV' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');

    RETURN v_quote_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_sales_report(p_company_id uuid, p_start_date date, p_end_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'total_sales', COALESCE(SUM(total_amount), 0),
        'invoice_count', COUNT(*),
        'status', 'completed',
        'generated_at', NOW()
    )
    INTO v_result
    FROM invoices
    WHERE company_id = p_company_id
    AND invoice_date BETWEEN p_start_date AND p_end_date;

    RETURN COALESCE(v_result, '{"error": "No data found"}'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_trial_balance(company_id_param uuid, end_date_param date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
    SELECT jsonb_agg(
        jsonb_build_object(
            'account_number', account_number,
            'account_name', account_name,
            'debit_balance', debit_balance,
            'credit_balance', credit_balance,
            'net_balance', net_balance
        )
        ORDER BY account_number
    ) as trial_balance
    FROM (
        SELECT
            a.account_number,
            a.name as account_name,
            COALESCE(balances.debit_sum, 0) as debit_balance,
            COALESCE(balances.credit_sum, 0) as credit_balance,
            COALESCE(balances.debit_sum, 0) - COALESCE(balances.credit_sum, 0) as net_balance
        FROM accounts a
        LEFT JOIN (
            SELECT
                account_id,
                SUM(debit_amount) as debit_sum,
                SUM(credit_amount) as credit_sum
            FROM journal_entry_items jei
            JOIN journal_entries je ON je.id = jei.journal_entry_id
            WHERE je.company_id = company_id_param
              AND je.status = 'posted'
              AND je.entry_date <= end_date_param
            GROUP BY account_id
        ) balances ON balances.account_id = a.id
        WHERE a.company_id = company_id_param
          AND a.is_active = true
        ORDER BY a.account_number
    ) ordered_accounts;
$function$
;

CREATE OR REPLACE FUNCTION public.get_account_balance_simple(p_account_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_balance DECIMAL := 0;
    v_account_type TEXT;
    v_total_debit DECIMAL := 0;
    v_total_credit DECIMAL := 0;
BEGIN
    -- Récupérer le type de compte
    SELECT account_type INTO v_account_type
    FROM accounts WHERE id = p_account_id;

    -- Calculer les totaux
    SELECT
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO v_total_debit, v_total_credit
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    WHERE jel.account_id = p_account_id
        AND je.entry_date <= p_date;

    -- Calculer le solde selon le type de compte
    IF v_account_type IN ('asset', 'expense') THEN
        v_balance := v_total_debit - v_total_credit;
    ELSE
        v_balance := v_total_credit - v_total_debit;
    END IF;

    RETURN v_balance;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_stock_alerts(p_company_id uuid, p_warehouse_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(alert_id uuid, product_name text, warehouse_name text, alert_type text, severity text, current_stock numeric, threshold_stock numeric, triggered_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        sa.id as alert_id,
        p.name as product_name,
        w.name as warehouse_name,
        sa.alert_type,
        sa.severity,
        sa.current_stock,
        sa.threshold_stock,
        sa.triggered_at
    FROM stock_alerts sa
    JOIN products p ON p.id = sa.product_id
    JOIN warehouses w ON w.id = sa.warehouse_id
    WHERE sa.company_id = p_company_id
    AND sa.is_active = true
    AND sa.is_acknowledged = false
    AND (p_warehouse_id IS NULL OR sa.warehouse_id = p_warehouse_id)
    ORDER BY
        CASE sa.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        sa.triggered_at DESC
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_allowed_modules_for_plan(p_plan_id text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN CASE
        WHEN p_plan_id = 'trial' THEN ARRAY[
            -- Tous les modules disponibles pendant l'essai
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',
            'reports', 'budget', 'humanResources', 'tax', 'contracts',
            'salesCrm', 'inventory', 'projects', 'onboarding'
        ]
        WHEN p_plan_id IN ('starter_monthly', 'starter_yearly') THEN ARRAY[
            -- Plan Starter : modules de base
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties'
        ]
        WHEN p_plan_id IN ('pro_monthly', 'pro_yearly') THEN ARRAY[
            -- Plan Pro : Starter + modules avancés
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',
            'reports', 'budget', 'humanResources', 'tax'
        ]
        WHEN p_plan_id IN ('enterprise_monthly', 'enterprise_yearly') THEN ARRAY[
            -- Plan Enterprise : Pro + modules entreprise
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing', 'banking', 'purchases', 'thirdParties',
            'reports', 'budget', 'humanResources', 'tax',
            'salesCrm', 'inventory', 'projects', 'contracts'
        ]
        WHEN p_plan_id = 'free' THEN ARRAY[
            -- Plan gratuit (limité)
            'dashboard', 'settings', 'users', 'security',
            'accounting', 'invoicing'
        ]
        ELSE ARRAY['dashboard', 'settings'] -- Plan de base limité
    END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_balance_sheet_data(p_company_id uuid, p_date_from date, p_date_to date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    assets_data JSON;
    liabilities_data JSON;
    equity_data JSON;
BEGIN
    -- Calculate Assets from journal entries directly
    WITH asset_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 1) = '5' THEN 'cash_and_equivalents'
                WHEN LEFT(je.account_code, 2) = '41' THEN 'accounts_receivable'
                WHEN LEFT(je.account_code, 1) = '3' THEN 'inventory'
                WHEN LEFT(je.account_code, 3) IN ('486', '487') THEN 'prepaid_expenses'
                WHEN LEFT(je.account_code, 1) = '2' AND LEFT(je.account_code, 2) IN ('20', '21') THEN 'intangible_assets'
                WHEN LEFT(je.account_code, 1) = '2' THEN 'fixed_assets'
                WHEN LEFT(je.account_code, 2) IN ('26', '27') THEN 'investments'
                ELSE 'other'
            END AS asset_type,
            COALESCE(SUM(je.debit_amount - je.credit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'asset'
          AND a.is_active = true
        GROUP BY asset_type
    ),
    current_assets AS (
        SELECT
            COALESCE(json_object_agg(asset_type, balance) FILTER (WHERE asset_type IN ('cash_and_equivalents', 'accounts_receivable', 'inventory', 'prepaid_expenses')), '{}'::json) AS current,
            COALESCE(SUM(balance) FILTER (WHERE asset_type IN ('cash_and_equivalents', 'accounts_receivable', 'inventory', 'prepaid_expenses')), 0) AS current_total
        FROM asset_calculations
    ),
    non_current_assets AS (
        SELECT
            COALESCE(json_object_agg(asset_type, balance) FILTER (WHERE asset_type IN ('fixed_assets', 'intangible_assets', 'investments', 'other')), '{}'::json) AS non_current,
            COALESCE(SUM(balance) FILTER (WHERE asset_type IN ('fixed_assets', 'intangible_assets', 'investments', 'other')), 0) AS non_current_total
        FROM asset_calculations
    )
    SELECT json_build_object(
        'current', ca.current,
        'nonCurrent', nca.non_current,
        'total', ca.current_total + nca.non_current_total
    ) INTO assets_data
    FROM current_assets ca, non_current_assets nca;

    -- Calculate Liabilities from journal entries directly
    WITH liability_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 2) = '40' THEN 'accounts_payable'
                WHEN LEFT(je.account_code, 2) IN ('42', '43') THEN 'accrued_expenses'
                WHEN LEFT(je.account_code, 3) = '512' THEN 'short_term_debt'
                WHEN LEFT(je.account_code, 2) IN ('16', '17') THEN 'long_term_debt'
                WHEN LEFT(je.account_code, 3) = '487' THEN 'deferred_revenue'
                ELSE 'other'
            END AS liability_type,
            COALESCE(SUM(je.credit_amount - je.debit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'liability'
          AND a.is_active = true
        GROUP BY liability_type
    ),
    current_liabilities AS (
        SELECT
            COALESCE(json_object_agg(liability_type, balance) FILTER (WHERE liability_type IN ('accounts_payable', 'accrued_expenses', 'short_term_debt', 'deferred_revenue')), '{}'::json) AS current,
            COALESCE(SUM(balance) FILTER (WHERE liability_type IN ('accounts_payable', 'accrued_expenses', 'short_term_debt', 'deferred_revenue')), 0) AS current_total
        FROM liability_calculations
    ),
    non_current_liabilities AS (
        SELECT
            COALESCE(json_object_agg(liability_type, balance) FILTER (WHERE liability_type IN ('long_term_debt', 'other')), '{}'::json) AS non_current,
            COALESCE(SUM(balance) FILTER (WHERE liability_type IN ('long_term_debt', 'other')), 0) AS non_current_total
        FROM liability_calculations
    )
    SELECT json_build_object(
        'current', cl.current,
        'nonCurrent', ncl.non_current,
        'total', cl.current_total + ncl.non_current_total
    ) INTO liabilities_data
    FROM current_liabilities cl, non_current_liabilities ncl;

    -- Calculate Equity from journal entries directly
    WITH equity_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 3) = '101' THEN 'share_capital'
                WHEN LEFT(je.account_code, 2) = '11' THEN 'retained_earnings'
                WHEN LEFT(je.account_code, 2) = '12' THEN 'current_year_result'
                ELSE 'other'
            END AS equity_type,
            COALESCE(SUM(je.credit_amount - je.debit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'equity'
          AND a.is_active = true
        GROUP BY equity_type
    )
    SELECT json_build_object(
        'share_capital', COALESCE(SUM(balance) FILTER (WHERE equity_type = 'share_capital'), 0),
        'retained_earnings', COALESCE(SUM(balance) FILTER (WHERE equity_type = 'retained_earnings'), 0),
        'current_year_result', COALESCE(SUM(balance) FILTER (WHERE equity_type = 'current_year_result'), 0),
        'total', COALESCE(SUM(balance), 0)
    ) INTO equity_data
    FROM equity_calculations;

    -- Build final result
    result := json_build_object(
        'assets', assets_data,
        'liabilities', liabilities_data,
        'equity', equity_data
    );

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_budget_forecast(p_company_id uuid, p_budget_id uuid, p_as_of_date date, p_mode text DEFAULT 'prorata'::text)
 RETURNS TABLE(year integer, month integer, category_id uuid, category_code text, category_name text, category_type text, amount_actual numeric, amount_budget numeric, amount_forecast numeric, variance_amount numeric, variance_percentage numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_current_year INTEGER;
  v_current_month INTEGER;
  v_current_day INTEGER;
  v_days_in_month INTEGER;
  v_prorata_factor NUMERIC;
BEGIN
  -- Extraire date components
  v_current_year := EXTRACT(YEAR FROM p_as_of_date)::INTEGER;
  v_current_month := EXTRACT(MONTH FROM p_as_of_date)::INTEGER;
  v_current_day := EXTRACT(DAY FROM p_as_of_date)::INTEGER;
  v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', p_as_of_date) + INTERVAL '1 month - 1 day'))::INTEGER;
  v_prorata_factor := v_current_day::NUMERIC / v_days_in_month::NUMERIC;

  RETURN QUERY
  WITH
  -- Réels jusqu'au mois M-1
  actuals AS (
    SELECT
      v.year,
      v.month,
      v.category_id,
      SUM(v.amount_actual) AS amount_actual
    FROM v_actuals_by_category v
    WHERE v.company_id = p_company_id
      AND (v.year < v_current_year OR (v.year = v_current_year AND v.month < v_current_month))
    GROUP BY 1, 2, 3
  ),
  -- Budget complet de l'année
  budget AS (
    SELECT
      vb.year,
      vb.month,
      vb.category_id,
      vb.category_code,
      vb.category_name,
      vb.category_type,
      SUM(vb.amount_budget) AS amount_budget
    FROM v_budget_by_category_monthly vb
    WHERE vb.company_id = p_company_id
      AND vb.budget_id = p_budget_id
      AND vb.year = v_current_year
    GROUP BY 1, 2, 3, 4, 5, 6
  ),
  -- Grille de tous les mois/catégories
  grid AS (
    SELECT DISTINCT
      b.year,
      b.month,
      b.category_id,
      b.category_code,
      b.category_name,
      b.category_type
    FROM budget b
    UNION
    SELECT DISTINCT
      a.year,
      a.month,
      a.category_id,
      b.category_code,
      b.category_name,
      b.category_type
    FROM actuals a
    LEFT JOIN budget b ON b.category_id = a.category_id AND b.month = 1
  )
  SELECT
    g.year,
    g.month,
    g.category_id,
    g.category_code,
    g.category_name,
    g.category_type,
    COALESCE(a.amount_actual, 0) AS amount_actual,
    COALESCE(b.amount_budget, 0) AS amount_budget,
    -- Calcul du forecast selon la période
    CASE
      -- Mois passés complets: réel
      WHEN (g.year < v_current_year OR (g.year = v_current_year AND g.month < v_current_month))
        THEN COALESCE(a.amount_actual, 0)
      -- Mois courant: prorata du budget
      WHEN (g.year = v_current_year AND g.month = v_current_month)
        THEN CASE
          WHEN p_mode = 'prorata' THEN COALESCE(b.amount_budget, 0) * v_prorata_factor
          ELSE COALESCE(b.amount_budget, 0) * v_prorata_factor
        END
      -- Mois futurs: budget plein
      ELSE COALESCE(b.amount_budget, 0)
    END AS amount_forecast,
    -- Écart forecast vs budget
    CASE
      WHEN (g.year < v_current_year OR (g.year = v_current_year AND g.month < v_current_month))
        THEN COALESCE(a.amount_actual, 0) - COALESCE(b.amount_budget, 0)
      WHEN (g.year = v_current_year AND g.month = v_current_month)
        THEN (COALESCE(b.amount_budget, 0) * v_prorata_factor) - COALESCE(b.amount_budget, 0)
      ELSE 0
    END AS variance_amount,
    -- Variance en pourcentage
    CASE
      WHEN COALESCE(b.amount_budget, 0) = 0 THEN 0
      ELSE (
        CASE
          WHEN (g.year < v_current_year OR (g.year = v_current_year AND g.month < v_current_month))
            THEN (COALESCE(a.amount_actual, 0) - COALESCE(b.amount_budget, 0)) / COALESCE(b.amount_budget, 1) * 100
          ELSE 0
        END
      )
    END AS variance_percentage
  FROM grid g
  LEFT JOIN actuals a ON a.year = g.year AND a.month = g.month AND a.category_id = g.category_id
  LEFT JOIN budget b ON b.year = g.year AND b.month = g.month AND b.category_id = g.category_id
  ORDER BY g.year, g.month, g.category_type DESC, g.category_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_budget_forecast_kpi(p_company_id uuid, p_budget_id uuid, p_as_of_date date)
 RETURNS TABLE(total_actual_ytd numeric, total_budget_annual numeric, total_forecast_eoy numeric, variance_vs_budget numeric, variance_percentage numeric, absorption_rate numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH forecast_data AS (
    SELECT * FROM get_budget_forecast(p_company_id, p_budget_id, p_as_of_date, 'prorata')
  )
  SELECT
    SUM(CASE WHEN month < EXTRACT(MONTH FROM p_as_of_date) THEN amount_actual ELSE 0 END) AS total_actual_ytd,
    SUM(amount_budget) AS total_budget_annual,
    SUM(amount_forecast) AS total_forecast_eoy,
    SUM(amount_forecast) - SUM(amount_budget) AS variance_vs_budget,
    CASE
      WHEN SUM(amount_budget) = 0 THEN 0
      ELSE (SUM(amount_forecast) - SUM(amount_budget)) / SUM(amount_budget) * 100
    END AS variance_percentage,
    CASE
      WHEN SUM(amount_budget) = 0 THEN 0
      ELSE SUM(CASE WHEN month < EXTRACT(MONTH FROM p_as_of_date) THEN amount_actual ELSE 0 END) / SUM(amount_budget) * 100
    END AS absorption_rate
  FROM forecast_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cash_flow_data(p_company_id uuid, p_date_from date, p_date_to date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    operating_activities JSON;
    investing_activities JSON;
    financing_activities JSON;
    net_cash_change NUMERIC;
    beginning_cash NUMERIC;
    ending_cash NUMERIC;
    net_income_val NUMERIC;
BEGIN
    -- Get net income for operating activities base
    SELECT (get_income_statement_data(p_company_id, p_date_from, p_date_to)->>'net_income')::NUMERIC
    INTO net_income_val;

    -- Calculate operating activities (simplifié)
    WITH operating_data AS (
        SELECT
            COALESCE(net_income_val, 0) as net_income,
            -- Depreciation from expenses
            COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 3) = '681'), 0) as depreciation,
            -- Working capital changes (approximation)
            COALESCE(SUM(
                CASE
                    WHEN LEFT(je.account_code, 2) = '41' THEN je.credit_amount - je.debit_amount  -- AR decrease
                    WHEN LEFT(je.account_code, 1) = '3' THEN je.credit_amount - je.debit_amount   -- Inventory decrease
                    WHEN LEFT(je.account_code, 2) = '40' THEN je.debit_amount - je.credit_amount  -- AP increase
                    ELSE 0
                END
            ), 0) as working_capital_changes
        FROM journal_entries je
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
    )
    SELECT json_build_object(
        'net_income', net_income,
        'depreciation', depreciation,
        'working_capital_changes', working_capital_changes,
        'other_adjustments', 0,
        'total', net_income + depreciation + working_capital_changes
    ) INTO operating_activities
    FROM operating_data;

    -- Calculate investing activities (simplifié)
    WITH investing_data AS (
        SELECT
            -- Capital expenditures (purchases of fixed assets)
            -COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 1) = '2'), 0) as capex,
            -- Investments
            COALESCE(SUM(je.credit_amount - je.debit_amount) FILTER (WHERE LEFT(je.account_code, 2) IN ('26', '27')), 0) as investments
        FROM journal_entries je
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
    )
    SELECT json_build_object(
        'capital_expenditures', capex,
        'acquisitions', 0,
        'asset_sales', 0,
        'investments', investments,
        'total', capex + investments
    ) INTO investing_activities
    FROM investing_data;

    -- Calculate financing activities (simplifié)
    WITH financing_data AS (
        SELECT
            -- Debt changes
            COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 2) IN ('16', '17') OR je.account_code LIKE '512%'), 0) as debt_changes,
            -- Equity changes
            COALESCE(SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 3) = '101'), 0) as equity_changes
        FROM journal_entries je
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
    )
    SELECT json_build_object(
        'debt_changes', debt_changes,
        'equity_changes', equity_changes,
        'dividends', 0,
        'other', 0,
        'total', debt_changes + equity_changes
    ) INTO financing_activities
    FROM financing_data;

    -- Calculate net cash change and positions
    SELECT
        (operating_activities->>'total')::NUMERIC +
        (investing_activities->>'total')::NUMERIC +
        (financing_activities->>'total')::NUMERIC
    INTO net_cash_change;

    -- Get beginning cash (simplifié)
    SELECT COALESCE(
        SUM(je.debit_amount - je.credit_amount) FILTER (WHERE LEFT(je.account_code, 1) = '5' AND je.date < p_date_from), 0
    ) INTO beginning_cash
    FROM journal_entries je
    WHERE je.company_id = p_company_id;

    ending_cash := COALESCE(beginning_cash, 0) + COALESCE(net_cash_change, 0);

    -- Build final result
    result := json_build_object(
        'operating_activities', operating_activities,
        'investing_activities', investing_activities,
        'financing_activities', financing_activities,
        'net_cash_change', net_cash_change,
        'beginning_cash', beginning_cash,
        'ending_cash', ending_cash
    );

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_company_ai_summary(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_alerts', (
            SELECT COUNT(*) FROM smart_alerts
            WHERE company_id = p_company_id
            AND is_read = FALSE
            AND is_dismissed = FALSE
        ),
        'recent_insights', (
            SELECT COUNT(*) FROM ai_insights
            WHERE company_id = p_company_id
            AND status = 'active'
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        'tax_optimizations', (
            SELECT COUNT(*) FROM tax_optimizations
            WHERE company_id = p_company_id
            AND status IN ('suggested', 'in_progress')
        ),
        'anomalies_this_month', (
            SELECT COUNT(*) FROM anomaly_detections
            WHERE company_id = p_company_id
            AND status IN ('open', 'investigating')
            AND detected_at > NOW() - INTERVAL '30 days'
        ),
        'ai_interactions_this_week', (
            SELECT COUNT(*) FROM ai_interactions
            WHERE company_id = p_company_id
            AND timestamp > NOW() - INTERVAL '7 days'
        )
    ) INTO result;

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_company_features_detailed(p_company_id uuid)
 RETURNS TABLE(feature_name text, display_name_fr text, category text, is_enabled boolean, configuration jsonb, current_usage integer, usage_limit integer, expires_at timestamp with time zone, is_expired boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cf.feature_name,
        COALESCE(af.display_name_fr, cf.feature_name),
        COALESCE(cf.feature_category, af.category),
        cf.is_enabled,
        cf.configuration,
        cf.current_usage,
        cf.usage_limit,
        cf.expires_at,
        (cf.expires_at IS NOT NULL AND cf.expires_at < NOW()) as is_expired
    FROM company_features cf
    LEFT JOIN available_features af ON cf.feature_name = af.feature_name
    WHERE cf.company_id = p_company_id
    ORDER BY af.sort_order NULLS LAST, cf.feature_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_company_modules_config(p_company_id uuid)
 RETURNS TABLE(module_key text, display_name text, is_enabled boolean, configuration jsonb, access_level text, usage_stats jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cm.module_key,
        COALESCE(cm.custom_name, mc.display_name_fr, cm.module_name),
        cm.is_enabled,
        cm.custom_settings,
        cm.access_level,
        jsonb_build_object(
            'usage_count', cm.usage_count,
            'last_used_at', cm.last_used_at,
            'activated_at', cm.activated_at,
            'storage_used_gb', 0, -- À implémenter selon vos besoins
            'users_count', 0 -- À implémenter selon vos besoins
        )
    FROM company_modules cm
    LEFT JOIN module_catalog mc ON cm.module_key = mc.module_key
    WHERE cm.company_id = p_company_id
    AND cm.is_enabled = true
    ORDER BY cm.module_priority DESC, cm.display_order;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_complete_company_profile(p_company_id uuid)
 RETURNS TABLE(id uuid, name text, legal_name text, siret text, sector text, industry_type text, company_size text, ceo_name text, ceo_title text, share_capital numeric, registration_date date, timezone text, data_quality_score integer, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.legal_name,
        c.siret,
        c.sector,
        c.industry_type,
        c.company_size,
        c.ceo_name,
        c.ceo_title,
        c.share_capital,
        c.registration_date,
        c.timezone,
        c.data_quality_score,
        c.status
    FROM companies c
    WHERE c.id = p_company_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_country_config(country_code_param text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    country_config JSONB;
BEGIN
    SELECT jsonb_build_object(
        'country', row_to_json(c),
        'tax_rates', COALESCE(
            (SELECT jsonb_agg(row_to_json(t))
             FROM tax_rates_catalog t
             WHERE t.country_code = c.code AND t.is_active = true),
            '[]'::jsonb
        ),
        'timezones', COALESCE(
            (SELECT jsonb_agg(row_to_json(tz))
             FROM timezones_catalog tz
             WHERE c.timezone = tz.timezone_name),
            '[]'::jsonb
        )
    ) INTO country_config
    FROM countries_catalog c
    WHERE c.code = country_code_param AND c.is_active = true;

    RETURN COALESCE(country_config, '{}'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_crm_stats_real(company_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clients', (
      SELECT COUNT(*) FROM third_parties
      WHERE company_id = company_uuid AND client_type IN ('customer', 'prospect')
    ),
    'total_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid
    ),
    'won_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'won'
    ),
    'lost_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'lost'
    ),
    'pending_opportunities', (
      SELECT COUNT(*) FROM crm_opportunities
      WHERE company_id = company_uuid AND status NOT IN ('won', 'lost')
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(value), 0) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'won'
    ),
    'pipeline_value', (
      SELECT COALESCE(SUM(value), 0) FROM crm_opportunities
      WHERE company_id = company_uuid AND status NOT IN ('won', 'lost')
    ),
    'avg_deal_size', (
      SELECT COALESCE(AVG(value), 0) FROM crm_opportunities
      WHERE company_id = company_uuid AND status = 'won'
    ),
    'conversion_rate', (
      SELECT
        CASE
          WHEN COUNT(*) > 0 THEN
            ROUND(
              (COUNT(*) FILTER (WHERE status = 'won')::decimal / COUNT(*)) * 100,
              2
            )
          ELSE 0
        END
      FROM crm_opportunities
      WHERE company_id = company_uuid AND status IN ('won', 'lost')
    )
  ) INTO result;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_enterprise_dashboard_data(p_company_id uuid, p_period text DEFAULT 'current_month'::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_comparison_period text DEFAULT 'previous_month'::text, p_include_forecasts boolean DEFAULT true, p_include_benchmarks boolean DEFAULT false, p_currency text DEFAULT 'EUR'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_start_date DATE;
    v_end_date DATE;
    v_prev_start_date DATE;
    v_prev_end_date DATE;
    v_total_revenue DECIMAL(15,2) := 0;
    v_total_expenses DECIMAL(15,2) := 0;
    v_cash_position DECIMAL(15,2) := 0;
    v_revenue_growth DECIMAL(5,2) := 0;
    v_profit_margin DECIMAL(5,2) := 0;
BEGIN
    -- Calcul des dates de période
    IF p_start_date IS NULL THEN
        CASE p_period
            WHEN 'current_month' THEN
                v_start_date := DATE_TRUNC('month', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
            WHEN 'current_quarter' THEN
                v_start_date := DATE_TRUNC('quarter', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '3 months' - INTERVAL '1 day';
            WHEN 'current_year' THEN
                v_start_date := DATE_TRUNC('year', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '1 year' - INTERVAL '1 day';
            ELSE
                v_start_date := DATE_TRUNC('month', CURRENT_DATE);
                v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
        END CASE;
    ELSE
        v_start_date := p_start_date;
        v_end_date := p_end_date;
    END IF;

    -- Calcul des dates de période de comparaison
    CASE p_comparison_period
        WHEN 'previous_month' THEN
            v_prev_start_date := v_start_date - INTERVAL '1 month';
            v_prev_end_date := v_end_date - INTERVAL '1 month';
        WHEN 'previous_year' THEN
            v_prev_start_date := v_start_date - INTERVAL '1 year';
            v_prev_end_date := v_end_date - INTERVAL '1 year';
        ELSE
            v_prev_start_date := v_start_date - INTERVAL '1 month';
            v_prev_end_date := v_end_date - INTERVAL '1 month';
    END CASE;

    -- Calcul du chiffre d'affaires
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_total_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_start_date AND v_end_date
      AND status = 'paid';

    -- Calcul des dépenses (comptes de charges)
    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_total_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_start_date AND v_end_date
      AND coa.account_type = 'expense';

    -- Position de trésorerie
    SELECT COALESCE(SUM(current_balance), 0)
    INTO v_cash_position
    FROM bank_accounts
    WHERE company_id = p_company_id
      AND is_active = true;

    -- Calcul de la marge
    IF v_total_revenue > 0 THEN
        v_profit_margin := ((v_total_revenue - v_total_expenses) / v_total_revenue) * 100;
    END IF;

    -- Construction du résultat JSON
    v_result := json_build_object(
        'executive_summary', json_build_object(
            'revenue_ytd', v_total_revenue,
            'revenue_growth', v_revenue_growth,
            'profit_margin', v_profit_margin,
            'cash_runway_days', 90, -- Valeur par défaut
            'customer_satisfaction', 85, -- Valeur par défaut
            'market_position', 'Croissance',
            'key_achievements', json_build_array(
                'Objectifs de CA atteints',
                'Nouvelle intégration bancaire',
                'Optimisation des processus'
            ),
            'strategic_priorities', json_build_array(
                'Développement commercial',
                'Digitalisation',
                'Optimisation des coûts'
            )
        ),
        'key_metrics', json_build_array(
            json_build_object(
                'id', 'revenue',
                'title', 'Chiffre d''affaires',
                'current_value', v_total_revenue,
                'unit', 'currency',
                'trend_percentage', v_revenue_growth,
                'color', 'green',
                'category', 'financial'
            ),
            json_build_object(
                'id', 'expenses',
                'title', 'Dépenses',
                'current_value', v_total_expenses,
                'unit', 'currency',
                'color', 'red',
                'category', 'financial'
            ),
            json_build_object(
                'id', 'cash_position',
                'title', 'Position de trésorerie',
                'current_value', v_cash_position,
                'unit', 'currency',
                'color', 'blue',
                'category', 'financial'
            ),
            json_build_object(
                'id', 'profit_margin',
                'title', 'Marge bénéficiaire',
                'current_value', v_profit_margin,
                'unit', 'percentage',
                'color', CASE WHEN v_profit_margin >= 0 THEN 'green' ELSE 'red' END,
                'category', 'financial'
            )
        ),
        'charts', json_build_array(
            json_build_object(
                'id', 'revenue_trend',
                'title', 'Évolution du CA',
                'type', 'line',
                'data', json_build_array()
            ),
            json_build_object(
                'id', 'expense_breakdown',
                'title', 'Répartition des dépenses',
                'type', 'pie',
                'data', json_build_array()
            )
        ),
        'financial_health', json_build_object(
            'overall_score', 75,
            'liquidity_score', 80,
            'profitability_score', 70,
            'efficiency_score', 75,
            'growth_score', 65,
            'risk_score', 60
        ),
        'cash_flow_forecast', json_build_array(),
        'budget_comparison', json_build_array(),
        'period_comparisons', json_build_array(),
        'alerts', json_build_array(),
        'operational_kpis', json_build_array(),
        'profitability_analysis', json_build_object()
    );

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_financial_ratios(p_company_id uuid, p_date_from date, p_date_to date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    balance_sheet_data JSON;
    income_statement_data JSON;
BEGIN
    -- Get balance sheet and income statement data
    SELECT get_balance_sheet_data(p_company_id, p_date_from, p_date_to) INTO balance_sheet_data;
    SELECT get_income_statement_data(p_company_id, p_date_from, p_date_to) INTO income_statement_data;

    -- Calculate ratios
    WITH financial_metrics AS (
        SELECT
            -- Balance sheet values
            COALESCE((balance_sheet_data->'assets'->>'total')::NUMERIC, 0) AS total_assets,
            COALESCE((balance_sheet_data->'liabilities'->>'total')::NUMERIC, 0) AS total_liabilities,
            COALESCE((balance_sheet_data->'equity'->>'total')::NUMERIC, 0) AS total_equity,

            -- Income statement values
            COALESCE((income_statement_data->'revenue'->>'total')::NUMERIC, 0) AS total_revenue,
            COALESCE((income_statement_data->'margins'->>'gross_margin')::NUMERIC, 0) AS gross_margin,
            COALESCE((income_statement_data->'margins'->>'operating_margin')::NUMERIC, 0) AS operating_margin,
            COALESCE((income_statement_data->>'net_income')::NUMERIC, 0) AS net_income
    )
    SELECT json_build_object(
        'liquidity', json_build_object(
            'current_ratio', CASE WHEN total_liabilities > 0 THEN total_assets / total_liabilities ELSE NULL END,
            'quick_ratio', CASE WHEN total_liabilities > 0 THEN (total_assets * 0.7) / total_liabilities ELSE NULL END,
            'cash_ratio', CASE WHEN total_liabilities > 0 THEN (total_assets * 0.1) / total_liabilities ELSE NULL END
        ),
        'profitability', json_build_object(
            'gross_margin', CASE WHEN total_revenue > 0 THEN (gross_margin / total_revenue) * 100 ELSE NULL END,
            'operating_margin', CASE WHEN total_revenue > 0 THEN (operating_margin / total_revenue) * 100 ELSE NULL END,
            'net_margin', CASE WHEN total_revenue > 0 THEN (net_income / total_revenue) * 100 ELSE NULL END,
            'roa', CASE WHEN total_assets > 0 THEN (net_income / total_assets) * 100 ELSE NULL END,
            'roe', CASE WHEN total_equity > 0 THEN (net_income / total_equity) * 100 ELSE NULL END
        ),
        'leverage', json_build_object(
            'debt_to_equity', CASE WHEN total_equity > 0 THEN total_liabilities / total_equity ELSE NULL END,
            'debt_to_assets', CASE WHEN total_assets > 0 THEN total_liabilities / total_assets ELSE NULL END,
            'interest_coverage', NULL
        ),
        'efficiency', json_build_object(
            'asset_turnover', CASE WHEN total_assets > 0 THEN total_revenue / total_assets ELSE NULL END,
            'inventory_turnover', NULL,
            'receivables_turnover', NULL
        )
    ) INTO result
    FROM financial_metrics;

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_fiscal_template_by_country(p_country_code text)
 RETURNS TABLE(country_name text, accounting_standard text, default_currency text, fiscal_year_end text, vat_config jsonb, tax_accounts jsonb, compliance jsonb, payroll_taxes jsonb, depreciation jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        fct.country_name,
        fct.accounting_standard,
        fct.default_currency,
        fct.fiscal_year_end,
        fct.default_vat_config,
        fct.default_tax_accounts,
        fct.compliance_requirements,
        fct.payroll_tax_config,
        fct.depreciation_rates
    FROM fiscal_country_templates fct
    WHERE fct.country_code = p_country_code
    AND fct.is_active = TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_income_statement_data(p_company_id uuid, p_date_from date, p_date_to date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    revenue_data JSON;
    expenses_data JSON;
    margins_data JSON;
    net_income_value NUMERIC;
BEGIN
    -- Calculate Revenue from journal entries directly
    WITH revenue_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 2) IN ('70', '71', '72', '74') THEN 'operating_revenue'
                WHEN LEFT(je.account_code, 2) IN ('75', '76', '77') THEN 'other_revenue'
                ELSE 'other'
            END AS revenue_type,
            COALESCE(SUM(je.credit_amount - je.debit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'revenue'
          AND a.is_active = true
        GROUP BY revenue_type
    )
    SELECT json_build_object(
        'operating_revenue', COALESCE(SUM(balance) FILTER (WHERE revenue_type = 'operating_revenue'), 0),
        'other_revenue', COALESCE(SUM(balance) FILTER (WHERE revenue_type = 'other_revenue'), 0),
        'total', COALESCE(SUM(balance), 0)
    ) INTO revenue_data
    FROM revenue_calculations;

    -- Calculate Expenses from journal entries directly
    WITH expense_calculations AS (
        SELECT
            CASE
                WHEN LEFT(je.account_code, 2) = '60' THEN 'cost_of_goods_sold'
                WHEN LEFT(je.account_code, 2) IN ('61', '62', '63', '64', '65') THEN 'operating_expenses'
                WHEN LEFT(je.account_code, 3) = '681' THEN 'depreciation'
                WHEN LEFT(je.account_code, 2) = '66' THEN 'interest_expense'
                WHEN LEFT(je.account_code, 3) = '695' THEN 'tax_expense'
                WHEN LEFT(je.account_code, 2) = '67' THEN 'other_expenses'
                ELSE 'other'
            END AS expense_type,
            COALESCE(SUM(je.debit_amount - je.credit_amount), 0) AS balance
        FROM journal_entries je
        INNER JOIN accounts a ON je.account_code = a.account_number AND a.company_id = p_company_id
        WHERE je.company_id = p_company_id
          AND je.date BETWEEN p_date_from AND p_date_to
          AND a.type = 'expense'
          AND a.is_active = true
        GROUP BY expense_type
    )
    SELECT json_build_object(
        'cost_of_goods_sold', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'cost_of_goods_sold'), 0),
        'operating_expenses', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'operating_expenses'), 0),
        'depreciation', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'depreciation'), 0),
        'interest_expense', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'interest_expense'), 0),
        'tax_expense', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'tax_expense'), 0),
        'other_expenses', COALESCE(SUM(balance) FILTER (WHERE expense_type = 'other_expenses'), 0),
        'total', COALESCE(SUM(balance), 0)
    ) INTO expenses_data
    FROM expense_calculations;

    -- Calculate margins and net income
    WITH financial_metrics AS (
        SELECT
            (revenue_data->>'total')::NUMERIC AS total_revenue,
            (expenses_data->>'cost_of_goods_sold')::NUMERIC AS cogs,
            (expenses_data->>'operating_expenses')::NUMERIC AS opex,
            (expenses_data->>'depreciation')::NUMERIC AS depreciation,
            (expenses_data->>'interest_expense')::NUMERIC AS interest,
            (expenses_data->>'tax_expense')::NUMERIC AS tax,
            (expenses_data->>'other_expenses')::NUMERIC AS other_exp,
            (expenses_data->>'total')::NUMERIC AS total_expenses
    )
    SELECT
        json_build_object(
            'gross_margin', total_revenue - cogs,
            'operating_margin', total_revenue - cogs - opex - depreciation,
            'net_margin', total_revenue - total_expenses
        ),
        total_revenue - total_expenses
    INTO margins_data, net_income_value
    FROM financial_metrics;

    -- Build final result
    result := json_build_object(
        'revenue', revenue_data,
        'expenses', expenses_data,
        'margins', margins_data,
        'net_income', net_income_value
    );

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_onboarding_stats(p_company_id uuid DEFAULT NULL::uuid, p_days_back integer DEFAULT 30)
 RETURNS TABLE(total_sessions bigint, completed_sessions bigint, abandoned_sessions bigint, avg_completion_time_minutes numeric, completion_rate_pct numeric, most_problematic_step text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE final_status = 'completed') as completed,
            COUNT(*) FILTER (WHERE final_status = 'abandoned') as abandoned,
            AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) as avg_completion_minutes
        FROM onboarding_sessions os
        WHERE (p_company_id IS NULL OR os.company_id = p_company_id)
        AND os.started_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    ),
    step_problems AS (
        SELECT
            step_name,
            COUNT(*) FILTER (WHERE completion_status IN ('error', 'abandoned')) as problem_count
        FROM onboarding_history oh
        WHERE (p_company_id IS NULL OR oh.company_id = p_company_id)
        AND oh.completion_time >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
        GROUP BY step_name
        ORDER BY problem_count DESC
        LIMIT 1
    )
    SELECT
        ss.total,
        ss.completed,
        ss.abandoned,
        ROUND(ss.avg_completion_minutes, 2),
        CASE WHEN ss.total > 0 THEN ROUND(ss.completed::numeric / ss.total * 100, 2) ELSE 0 END,
        sp.step_name
    FROM session_stats ss
    CROSS JOIN step_problems sp;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(p_user_id uuid)
 RETURNS user_profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_profile user_profiles;
BEGIN
  -- Essayer de récupérer le profil existant
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;

  -- Si le profil n'existe pas, le créer avec les données de auth.users
  IF NOT FOUND THEN
    INSERT INTO user_profiles (user_id, first_name, last_name)
    SELECT
      id,
      COALESCE(raw_user_meta_data->>'first_name', ''),
      COALESCE(raw_user_meta_data->>'last_name', '')
    FROM auth.users
    WHERE id = p_user_id
    RETURNING * INTO v_profile;
  END IF;

  RETURN v_profile;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_performance_comparison(p_company_id uuid, p_period text DEFAULT 'current_month'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_current_revenue DECIMAL(15,2) := 0;
    v_previous_revenue DECIMAL(15,2) := 0;
    v_budget_revenue DECIMAL(15,2) := 0;
    v_current_expenses DECIMAL(15,2) := 0;
    v_previous_expenses DECIMAL(15,2) := 0;
    v_budget_expenses DECIMAL(15,2) := 0;
    v_start_date DATE;
    v_end_date DATE;
    v_prev_start DATE;
    v_prev_end DATE;
BEGIN
    -- Détermination des périodes
    CASE p_period
        WHEN 'current_month' THEN
            v_start_date := DATE_TRUNC('month', CURRENT_DATE);
            v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
            v_prev_start := v_start_date - INTERVAL '1 month';
            v_prev_end := v_end_date - INTERVAL '1 month';
        WHEN 'current_quarter' THEN
            v_start_date := DATE_TRUNC('quarter', CURRENT_DATE);
            v_end_date := v_start_date + INTERVAL '3 months' - INTERVAL '1 day';
            v_prev_start := v_start_date - INTERVAL '3 months';
            v_prev_end := v_end_date - INTERVAL '3 months';
        ELSE
            v_start_date := DATE_TRUNC('month', CURRENT_DATE);
            v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
            v_prev_start := v_start_date - INTERVAL '1 month';
            v_prev_end := v_end_date - INTERVAL '1 month';
    END CASE;

    -- Revenus période courante
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_current_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_start_date AND v_end_date
      AND status = 'paid';

    -- Revenus période précédente
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_previous_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND invoice_date BETWEEN v_prev_start AND v_prev_end
      AND status = 'paid';

    -- Dépenses période courante
    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_current_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_start_date AND v_end_date
      AND coa.account_type = 'expense';

    -- Dépenses période précédente
    SELECT COALESCE(SUM(jel.debit_amount), 0)
    INTO v_previous_expenses
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.journal_entry_id
    JOIN chart_of_accounts coa ON coa.id = jel.account_id
    WHERE je.company_id = p_company_id
      AND je.entry_date BETWEEN v_prev_start AND v_prev_end
      AND coa.account_type = 'expense';

    -- Budget (valeurs par défaut si pas de budget)
    v_budget_revenue := v_current_revenue * 1.1; -- +10% objectif
    v_budget_expenses := v_previous_expenses * 0.95; -- -5% objectif

    v_result := json_build_object(
        'period', p_period,
        'revenue_comparison', json_build_object(
            'current', v_current_revenue,
            'previous', v_previous_revenue,
            'budget', v_budget_revenue,
            'vs_previous_percent', CASE
                WHEN v_previous_revenue > 0 THEN ((v_current_revenue - v_previous_revenue) / v_previous_revenue * 100)
                ELSE 0
            END,
            'vs_budget_percent', CASE
                WHEN v_budget_revenue > 0 THEN ((v_current_revenue - v_budget_revenue) / v_budget_revenue * 100)
                ELSE 0
            END
        ),
        'expense_comparison', json_build_object(
            'current', v_current_expenses,
            'previous', v_previous_expenses,
            'budget', v_budget_expenses,
            'vs_previous_percent', CASE
                WHEN v_previous_expenses > 0 THEN ((v_current_expenses - v_previous_expenses) / v_previous_expenses * 100)
                ELSE 0
            END,
            'vs_budget_percent', CASE
                WHEN v_budget_expenses > 0 THEN ((v_current_expenses - v_budget_expenses) / v_budget_expenses * 100)
                ELSE 0
            END
        ),
        'profitability_comparison', json_build_object(
            'current_margin', CASE
                WHEN v_current_revenue > 0 THEN ((v_current_revenue - v_current_expenses) / v_current_revenue * 100)
                ELSE 0
            END,
            'previous_margin', CASE
                WHEN v_previous_revenue > 0 THEN ((v_previous_revenue - v_previous_expenses) / v_previous_revenue * 100)
                ELSE 0
            END
        )
    );

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_stock_summary(p_product_id uuid, p_warehouse_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_result JSONB;
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        'total_on_hand', COALESCE(SUM(ii.quantity_on_hand), 0),
        'total_reserved', COALESCE(SUM(ii.reserved_quantity), 0),
        'total_available', COALESCE(SUM(ii.available_quantity), 0),
        'total_value', COALESCE(SUM(ii.total_value), 0),
        'locations_count', COUNT(*),
        'warehouses', JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'warehouse_id', w.id,
                'warehouse_name', w.name,
                'quantity_on_hand', ii.quantity_on_hand,
                'available_quantity', ii.available_quantity,
                'value', ii.total_value
            )
        )
    ) INTO v_result
    FROM inventory_items ii
    JOIN warehouses w ON w.id = ii.warehouse_id
    WHERE ii.product_id = p_product_id
    AND (p_warehouse_id IS NULL OR ii.warehouse_id = p_warehouse_id);

    RETURN COALESCE(v_result, '{
        "total_on_hand": 0,
        "total_reserved": 0,
        "total_available": 0,
        "total_value": 0,
        "locations_count": 0,
        "warehouses": []
    }'::jsonb);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_purchase_analytics_simple(p_company_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_start_date DATE := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
    v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
    v_total_purchases INTEGER;
    v_total_amount DECIMAL;
    v_pending_amount DECIMAL;
    v_top_suppliers JSONB;
BEGIN
    -- Statistiques générales
    SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
    INTO v_total_purchases, v_total_amount
    FROM purchases
    WHERE company_id = p_company_id
    AND purchase_date BETWEEN v_start_date AND v_end_date
    AND status != 'cancelled';

    -- Montant en attente de paiement
    SELECT COALESCE(SUM(total_amount), 0) INTO v_pending_amount
    FROM purchases
    WHERE company_id = p_company_id
    AND payment_status IN ('pending', 'partial');

    -- Top 5 fournisseurs
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'supplier_name', s.name,
            'total_amount', sub.total_amount,
            'purchase_count', sub.purchase_count
        )
    ) INTO v_top_suppliers
    FROM (
        SELECT
            p.supplier_id,
            SUM(p.total_amount) as total_amount,
            COUNT(*) as purchase_count
        FROM purchases p
        WHERE p.company_id = p_company_id
        AND p.purchase_date BETWEEN v_start_date AND v_end_date
        AND p.status != 'cancelled'
        GROUP BY p.supplier_id
        ORDER BY total_amount DESC
        LIMIT 5
    ) sub
    JOIN suppliers s ON s.id = sub.supplier_id;

    RETURN JSONB_BUILD_OBJECT(
        'period', JSONB_BUILD_OBJECT('start_date', v_start_date, 'end_date', v_end_date),
        'total_purchases', v_total_purchases,
        'total_amount', v_total_amount,
        'pending_amount', v_pending_amount,
        'top_suppliers', COALESCE(v_top_suppliers, '[]'::jsonb)
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_realtime_metrics(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_metrics JSON;
    v_today_revenue DECIMAL(15,2) := 0;
    v_month_revenue DECIMAL(15,2) := 0;
    v_pending_invoices INTEGER := 0;
    v_overdue_invoices INTEGER := 0;
BEGIN
    -- CA du jour
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_today_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND DATE(invoice_date) = CURRENT_DATE
      AND status = 'paid';

    -- CA du mois
    SELECT COALESCE(SUM(total_incl_tax), 0)
    INTO v_month_revenue
    FROM invoices
    WHERE company_id = p_company_id
      AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
      AND status = 'paid';

    -- Factures en attente
    SELECT COUNT(*)
    INTO v_pending_invoices
    FROM invoices
    WHERE company_id = p_company_id
      AND status = 'pending';

    -- Factures en retard
    SELECT COUNT(*)
    INTO v_overdue_invoices
    FROM invoices
    WHERE company_id = p_company_id
      AND status = 'overdue'
      AND due_date < CURRENT_DATE;

    v_metrics := json_build_array(
        json_build_object(
            'id', 'daily_revenue',
            'title', 'CA du jour',
            'current_value', v_today_revenue,
            'unit', 'currency',
            'color', 'green',
            'category', 'financial'
        ),
        json_build_object(
            'id', 'monthly_revenue',
            'title', 'CA mensuel',
            'current_value', v_month_revenue,
            'unit', 'currency',
            'color', 'blue',
            'category', 'financial'
        ),
        json_build_object(
            'id', 'pending_invoices',
            'title', 'Factures en attente',
            'current_value', v_pending_invoices,
            'unit', 'number',
            'color', 'orange',
            'category', 'operational'
        ),
        json_build_object(
            'id', 'overdue_invoices',
            'title', 'Factures en retard',
            'current_value', v_overdue_invoices,
            'unit', 'number',
            'color', 'red',
            'category', 'risk'
        )
    );

    RETURN v_metrics;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recommended_company_sizes(sector_code_param text)
 RETURNS TABLE(size_code text, size_name text, category text, recommended_plan text, description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cs.size_code,
        cs.size_name,
        cs.category,
        cs.recommended_plan,
        cs.description
    FROM company_sizes_catalog cs
    WHERE cs.is_active = true
    AND EXISTS (
        SELECT 1 FROM sectors_catalog s
        WHERE s.sector_code = sector_code_param
        AND cs.size_code = ANY(s.typical_size_ranges)
    )
    ORDER BY cs.priority_order;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_supplier_balance_simple(p_supplier_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_purchases DECIMAL := 0;
    v_total_payments DECIMAL := 0;
    v_balance DECIMAL := 0;
BEGIN
    -- Total des achats
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_purchases
    FROM purchases
    WHERE supplier_id = p_supplier_id
    AND status != 'cancelled';

    -- Total des paiements
    SELECT COALESCE(SUM(amount), 0) INTO v_total_payments
    FROM supplier_payments
    WHERE supplier_id = p_supplier_id
    AND status = 'completed';

    -- Solde = Achats - Paiements
    v_balance := v_total_purchases - v_total_payments;

    RETURN v_balance;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_third_parties_stats(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_customers INTEGER;
    v_total_suppliers INTEGER;
    v_active_customers INTEGER;
    v_active_suppliers INTEGER;
    v_customers_balance DECIMAL;
    v_suppliers_balance DECIMAL;
BEGIN
    -- Compter les clients
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO v_total_customers, v_active_customers
    FROM customers
    WHERE company_id = p_company_id;

    -- Compter les fournisseurs
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
    INTO v_total_suppliers, v_active_suppliers
    FROM suppliers
    WHERE company_id = p_company_id;

    -- Solde clients (créances)
    SELECT COALESCE(SUM(balance), 0) INTO v_customers_balance
    FROM unified_third_parties_view
    WHERE company_id = p_company_id
    AND party_type = 'customer';

    -- Solde fournisseurs (dettes)
    SELECT COALESCE(SUM(balance), 0) INTO v_suppliers_balance
    FROM unified_third_parties_view
    WHERE company_id = p_company_id
    AND party_type = 'supplier';

    RETURN JSONB_BUILD_OBJECT(
        'customers', JSONB_BUILD_OBJECT(
            'total', v_total_customers,
            'active', v_active_customers,
            'balance', v_customers_balance
        ),
        'suppliers', JSONB_BUILD_OBJECT(
            'total', v_total_suppliers,
            'active', v_active_suppliers,
            'balance', v_suppliers_balance
        ),
        'totals', JSONB_BUILD_OBJECT(
            'total_parties', v_total_customers + v_total_suppliers,
            'active_parties', v_active_customers + v_active_suppliers,
            'net_balance', v_customers_balance - v_suppliers_balance
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_third_party_details(p_party_type text, p_party_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_party JSONB;
    v_contacts JSONB;
    v_addresses JSONB;
    v_documents JSONB;
BEGIN
    -- Récupérer les infos principales depuis la vue unifiée
    SELECT row_to_json(utp.*)::JSONB INTO v_party
    FROM unified_third_parties_view utp
    WHERE utp.party_type = p_party_type
    AND utp.id = p_party_id;

    -- Récupérer les contacts
    IF p_party_type = 'customer' THEN
        SELECT COALESCE(JSONB_AGG(row_to_json(c.*)), '[]'::jsonb) INTO v_contacts
        FROM contacts c
        WHERE c.customer_id = p_party_id AND c.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(a.*)), '[]'::jsonb) INTO v_addresses
        FROM third_party_addresses a
        WHERE a.customer_id = p_party_id AND a.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(d.*)), '[]'::jsonb) INTO v_documents
        FROM third_party_documents d
        WHERE d.customer_id = p_party_id AND d.is_active = true;
    ELSE
        SELECT COALESCE(JSONB_AGG(row_to_json(c.*)), '[]'::jsonb) INTO v_contacts
        FROM contacts c
        WHERE c.supplier_id = p_party_id AND c.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(a.*)), '[]'::jsonb) INTO v_addresses
        FROM third_party_addresses a
        WHERE a.supplier_id = p_party_id AND a.is_active = true;

        SELECT COALESCE(JSONB_AGG(row_to_json(d.*)), '[]'::jsonb) INTO v_documents
        FROM third_party_documents d
        WHERE d.supplier_id = p_party_id AND d.is_active = true;
    END IF;

    RETURN JSONB_BUILD_OBJECT(
        'party', v_party,
        'contacts', v_contacts,
        'addresses', v_addresses,
        'documents', v_documents
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_trial_statistics()
 RETURNS TABLE(metric text, value integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 'active_trials'::TEXT, COUNT(*)::INTEGER
    FROM subscriptions
    WHERE status = 'trialing'

    UNION ALL

    SELECT 'expired_trials'::TEXT, COUNT(*)::INTEGER
    FROM subscriptions
    WHERE status = 'expired'

    UNION ALL

    SELECT 'converted_trials'::TEXT, COUNT(*)::INTEGER
    FROM subscriptions
    WHERE status = 'active' AND trial_start IS NOT NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unmapped_journal_entries(p_company_id uuid, p_year integer)
 RETURNS TABLE(account_code text, total_amount numeric, entry_count bigint)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    jel.account_number AS account_code,
    SUM(jel.debit_amount - jel.credit_amount) AS total_amount,
    COUNT(DISTINCT jel.id) AS entry_count
  FROM journal_entries je
  JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
  WHERE je.company_id = p_company_id
    AND EXTRACT(YEAR FROM je.entry_date) = p_year
    AND je.status = 'posted'
    AND NOT EXISTS (
      SELECT 1 FROM category_account_map cam
      WHERE cam.company_id = je.company_id
        AND cam.account_code = jel.account_number
    )
  GROUP BY jel.account_number
  ORDER BY ABS(SUM(jel.debit_amount - jel.credit_amount)) DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > now());

  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_notifications(user_uuid uuid DEFAULT auth.uid())
 RETURNS TABLE(email_new_transactions boolean, email_weekly_reports boolean, email_system_updates boolean, email_marketing boolean, email_invoices boolean, email_payments boolean, email_reminders boolean, push_new_transactions boolean, push_alerts boolean, push_reminders boolean, push_system_updates boolean, notification_frequency text, quiet_hours_enabled boolean, quiet_hours_start time without time zone, quiet_hours_end time without time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    un.email_new_transactions,
    un.email_weekly_reports,
    un.email_system_updates,
    un.email_marketing,
    un.email_invoices,
    un.email_payments,
    un.email_reminders,
    un.push_new_transactions,
    un.push_alerts,
    un.push_reminders,
    un.push_system_updates,
    un.notification_frequency,
    un.quiet_hours_enabled,
    un.quiet_hours_start,
    un.quiet_hours_end
  FROM user_notifications un
  WHERE un.user_id = user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_preferences_with_fallback(p_user_id uuid, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(email_notifications boolean, push_notifications boolean, language text, currency text, timezone text, date_format text, theme text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(up.email_notifications, true),
        COALESCE(up.push_notifications, true),
        COALESCE(up.language, 'fr'),
        COALESCE(up.currency, 'EUR'),
        COALESCE(up.timezone, 'Europe/Paris'),
        COALESCE(up.date_format, 'DD/MM/YYYY'),
        COALESCE(up.theme, 'light')
    FROM user_preferences up
    WHERE up.user_id = p_user_id
    AND (p_company_id IS NULL OR up.company_id = p_company_id)
    ORDER BY up.updated_at DESC
    LIMIT 1;

    -- Si pas de préférences trouvées, retourner les valeurs par défaut
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT true, true, 'fr'::TEXT, 'EUR'::TEXT, 'Europe/Paris'::TEXT, 'DD/MM/YYYY'::TEXT, 'light'::TEXT;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id uuid)
 RETURNS TABLE(subscription_id uuid, plan_id text, status text, current_period_start timestamp with time zone, current_period_end timestamp with time zone, trial_start timestamp with time zone, trial_end timestamp with time zone, is_trial boolean, days_remaining integer, plan_name text, plan_price numeric, plan_currency text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        s.id as subscription_id,
        s.plan_id,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.trial_start,
        s.trial_end,
        (s.status = 'trialing') as is_trial,
        CASE
            WHEN s.status = 'trialing' AND s.trial_end IS NOT NULL
            THEN GREATEST(0, (s.trial_end::date - CURRENT_DATE))
            ELSE 0
        END as days_remaining,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.currency as plan_currency
    FROM subscriptions s
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_trial_info(p_user_id uuid)
 RETURNS TABLE(subscription_id uuid, plan_id text, status text, trial_start timestamp with time zone, trial_end timestamp with time zone, days_remaining integer, is_expired boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        s.id as subscription_id,
        s.plan_id,
        s.status,
        s.trial_start,
        s.trial_end,
        CASE
            WHEN s.trial_end IS NOT NULL
            THEN GREATEST(0, (s.trial_end::date - CURRENT_DATE))
            ELSE 0
        END as days_remaining,
        CASE
            WHEN s.trial_end IS NOT NULL
            THEN (s.trial_end < NOW())
            ELSE false
        END as is_expired
    FROM subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status = 'trialing'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_usage_limits(p_user_id uuid)
 RETURNS TABLE(feature_name text, current_usage integer, limit_value integer, percentage_used numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ut.feature_name,
    COALESCE(ut.current_usage, 0) AS current_usage,
    ut.limit_value,
    CASE
      WHEN ut.limit_value IS NULL OR ut.limit_value = -1 THEN 0
      WHEN ut.limit_value = 0 THEN 100
      ELSE ROUND((COALESCE(ut.current_usage, 0)::NUMERIC / ut.limit_value::NUMERIC) * 100, 2)
    END AS percentage_used
  FROM usage_tracking ut
  WHERE ut.user_id = p_user_id
  ORDER BY ut.feature_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.identify_potential_duplicates()
 RETURNS TABLE(normalized_name text, company_count bigint, company_names text[], company_ids uuid[])
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        normalize_company_name_safe(c.name) as norm_name,
        COUNT(*)::BIGINT as company_count,
        array_agg(c.name ORDER BY c.created_at) as company_names,
        array_agg(c.id ORDER BY c.created_at) as company_ids
    FROM companies c
    WHERE c.name IS NOT NULL
    AND COALESCE(c.status, 'active') = 'active'
    AND normalize_company_name_safe(c.name) IS NOT NULL
    GROUP BY normalize_company_name_safe(c.name)
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_feature_usage(p_user_id uuid, p_feature_name text, p_increment integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO usage_tracking (user_id, feature_name, current_usage, last_reset_at)
  VALUES (p_user_id, p_feature_name, p_increment, now())
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    current_usage = usage_tracking.current_usage + p_increment,
    updated_at = now();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.init_default_user_preferences(p_user_id uuid, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_pref_id UUID;
BEGIN
    INSERT INTO user_preferences (
        user_id,
        company_id,
        email_notifications,
        push_notifications,
        language,
        currency,
        timezone,
        date_format,
        theme
    ) VALUES (
        p_user_id,
        p_company_id,
        true,
        true,
        'fr',
        'EUR',
        'Europe/Paris',
        'DD/MM/YYYY',
        'light'
    )
    ON CONFLICT (user_id, company_id) DO UPDATE SET
        updated_at = NOW()
    RETURNING id INTO v_pref_id;

    RETURN v_pref_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_budget_category_mappings(p_company_id uuid, p_budget_id uuid, p_country_code text DEFAULT 'FR'::text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_category_record RECORD;
BEGIN
  -- Créer les catégories budgétaires depuis les templates
  FOR v_category_record IN (
    SELECT * FROM budget_category_templates
    WHERE country_code = p_country_code
      AND is_active = true
    ORDER BY display_order
  ) LOOP
    -- Insérer la catégorie budgétaire
    INSERT INTO budget_categories (
      budget_id,
      company_id,
      category,
      subcategory,
      category_type,
      driver_type,
      account_codes,
      annual_amount,
      monthly_amounts
    )
    VALUES (
      p_budget_id,
      p_company_id,
      v_category_record.category,
      v_category_record.subcategory,
      v_category_record.category_type,
      v_category_record.driver_type,
      v_category_record.default_account_numbers,
      0, -- À saisir par l'utilisateur
      ARRAY[0,0,0,0,0,0,0,0,0,0,0,0] -- 12 mois à 0
    )
    ON CONFLICT (budget_id, category, COALESCE(subcategory, '')) DO NOTHING;

    v_count := v_count + 1;

    -- Créer les mappings dans category_account_map
    IF v_category_record.default_account_numbers IS NOT NULL THEN
      INSERT INTO category_account_map (company_id, category_id, account_code)
      SELECT
        p_company_id,
        bc.id,
        unnest(v_category_record.default_account_numbers)
      FROM budget_categories bc
      WHERE bc.budget_id = p_budget_id
        AND bc.category = v_category_record.category
        AND COALESCE(bc.subcategory, '') = COALESCE(v_category_record.subcategory, '')
      ON CONFLICT (company_id, category_id, account_code) DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_company_chart_of_accounts(p_company_id uuid, p_country_code text DEFAULT 'FR'::text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Copier les comptes du template vers la table chart_of_accounts de l'entreprise
  INSERT INTO chart_of_accounts (
    company_id,
    account_number,
    name,
    type,
    class,
    description,
    is_active
  )
  SELECT
    p_company_id,
    t.account_number,
    t.account_name,
    t.account_type,
    t.class,
    t.description,
    true
  FROM chart_of_accounts_templates t
  WHERE t.country_code = p_country_code
    AND t.is_detail_account = true -- Uniquement les comptes de détail
    AND NOT EXISTS (
      SELECT 1 FROM chart_of_accounts c
      WHERE c.company_id = p_company_id
        AND c.account_number = t.account_number
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_client()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO crm_clients (
        id, company_id, name, type, status, primary_contact_name,
        primary_contact_email, primary_contact_phone, industry, website,
        total_value, tier, health_score
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.company_id,
        NEW.name,
        COALESCE(NEW.type, 'company'),
        COALESCE(NEW.status, 'active'),
        NEW.contact_name,
        NEW.email,
        NEW.phone,
        NEW.industry,
        NEW.website,
        COALESCE(NEW.total_value, 0.00),
        COALESCE(NEW.tier, 'standard'),
        COALESCE(NEW.health_score, 50)
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_client_from_view()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO crm_clients (
        company_id, name, type, status, primary_contact_name,
        primary_contact_email, primary_contact_phone, industry, website
    ) VALUES (
        NEW.company_id, NEW.name, NEW.type, NEW.status, NEW.contact_name,
        NEW.email, NEW.phone, NEW.industry, NEW.website
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_commercial_action()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO crm_activities (
        id, company_id, subject, description, type, status,
        due_date, priority, opportunity_id, client_id, lead_id, assigned_to
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.company_id,
        NEW.title,
        NEW.description,
        COALESCE(NEW.type, 'followup'),
        COALESCE(NEW.status, 'planned'),
        NEW.due_date,
        COALESCE(NEW.priority, 'medium'),
        NEW.opportunity_id,
        NEW.client_id,
        NEW.lead_id,
        NEW.assigned_to
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_opportunity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO crm_opportunities (
        id, company_id, title, description, value, probability,
        expected_close_date, status, source, client_id, owner_id,
        stage_id, pipeline_id
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.company_id,
        NEW.title,
        NEW.description,
        COALESCE(NEW.value, 0.00),
        COALESCE(NEW.probability, 50.00),
        NEW.close_date,
        COALESCE(NEW.status, 'open'),
        NEW.source,
        NEW.client_id,
        NEW.assigned_to,
        NEW.stage_id,
        NEW.pipeline_id
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_module_allowed_for_plan(p_module_name text, p_plan_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN p_module_name = ANY(get_allowed_modules_for_plan(p_plan_id));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_event_type text, p_table_name text DEFAULT NULL::text, p_record_id text DEFAULT NULL::text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT NULL::uuid, p_company_id uuid DEFAULT NULL::uuid, p_security_level text DEFAULT 'standard'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    audit_id UUID;
    user_info RECORD;
    integrity_data TEXT;
BEGIN
    -- Récupérer les infos utilisateur si disponibles
    IF p_user_id IS NOT NULL THEN
        SELECT email INTO user_info FROM auth.users WHERE id = p_user_id;
    END IF;

    -- Créer le hash d'intégrité
    integrity_data := CONCAT(p_event_type, p_table_name, p_record_id,
                            COALESCE(p_old_values::TEXT, ''),
                            COALESCE(p_new_values::TEXT, ''),
                            NOW()::TEXT);

    INSERT INTO audit_logs (
        event_type, table_name, record_id,
        old_values, new_values,
        user_id, user_email, company_id,
        security_level,
        ip_address, user_agent,
        integrity_hash,
        changed_fields
    ) VALUES (
        p_event_type, p_table_name, p_record_id,
        p_old_values, p_new_values,
        p_user_id, user_info.email, p_company_id,
        p_security_level,
        inet_client_addr(), current_setting('request.headers', true)::JSONB->>'user-agent',
        encode(digest(integrity_data, 'sha256'), 'hex'),
        CASE
            WHEN p_old_values IS NOT NULL AND p_new_values IS NOT NULL
            THEN (SELECT array_agg(key) FROM jsonb_each_text(p_new_values) WHERE value != COALESCE((p_old_values->>key), ''))
            ELSE NULL
        END
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_onboarding_step(p_company_id uuid, p_user_id uuid, p_step_name text, p_step_order integer, p_step_data jsonb DEFAULT '{}'::jsonb, p_completion_status text DEFAULT 'completed'::text, p_time_spent_seconds integer DEFAULT 0, p_session_id text DEFAULT NULL::text, p_validation_errors jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_history_id UUID;
    v_user_agent TEXT;
    v_ip_address INET;
BEGIN
    -- Récupérer contexte de la requête si possible
    BEGIN
        v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
        v_ip_address := inet(current_setting('request.headers', true)::json->>'x-forwarded-for');
    EXCEPTION WHEN OTHERS THEN
        -- Ignorer les erreurs de contexte
        NULL;
    END;

    -- Insérer l'étape
    INSERT INTO onboarding_history (
        company_id,
        user_id,
        step_name,
        step_order,
        step_data,
        completion_status,
        time_spent_seconds,
        session_id,
        validation_errors,
        user_agent,
        ip_address
    ) VALUES (
        p_company_id,
        p_user_id,
        p_step_name,
        p_step_order,
        p_step_data,
        p_completion_status,
        p_time_spent_seconds,
        p_session_id,
        p_validation_errors,
        v_user_agent,
        v_ip_address
    )
    RETURNING id INTO v_history_id;

    RETURN v_history_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_description text, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO security_events (event_type, description, company_id, created_at)
    VALUES (p_event_type, p_description, p_company_id, NOW())
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = now()
  WHERE user_id = p_user_id
    AND is_read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = now()
  WHERE id = p_notification_id
    AND user_id = p_user_id
    AND is_read = FALSE;

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.normalize_company_name_safe(company_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    IF company_name IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN UPPER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                UNACCENT(TRIM(company_name)),
                '[^A-Z0-9]', '', 'g'
            ),
            '(SARL|SAS|SASU|EURL|SA|SCI|SCOP)$', '', 'g'
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reactivate_subscription(p_user_id uuid, p_subscription_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE subscriptions
  SET
    cancel_at_period_end = FALSE,
    updated_at = now()
  WHERE id = p_subscription_id
    AND user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND cancel_at_period_end = TRUE;

  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_stock_movement_complete(p_product_id uuid, p_warehouse_id uuid, p_quantity numeric, p_movement_type text, p_unit_cost numeric DEFAULT 0, p_reference_type text DEFAULT NULL::text, p_reference_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_direction TEXT;
    v_movement_id UUID;
    v_current_stock DECIMAL;
    v_new_stock DECIMAL;
BEGIN
    -- Déterminer la direction
    v_direction := CASE
        WHEN p_movement_type LIKE '%_in' THEN 'in'
        WHEN p_movement_type LIKE '%_out' THEN 'out'
        ELSE 'in'
    END;

    -- Obtenir le stock actuel
    SELECT COALESCE(SUM(quantity_on_hand), 0) INTO v_current_stock
    FROM inventory_items
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

    -- Calculer le nouveau stock
    IF v_direction = 'in' THEN
        v_new_stock := v_current_stock + p_quantity;
    ELSE
        v_new_stock := v_current_stock - p_quantity;

        -- Vérifier que le stock ne devient pas négatif
        IF v_new_stock < 0 THEN
            RAISE EXCEPTION 'Stock insuffisant. Stock actuel: %, Quantité demandée: %', v_current_stock, p_quantity;
        END IF;
    END IF;

    -- Enregistrer le mouvement
    INSERT INTO inventory_movements (
        product_id, warehouse_id, movement_type, direction,
        quantity, unit_cost, reference_type, reference_id, notes
    ) VALUES (
        p_product_id, p_warehouse_id, p_movement_type, v_direction,
        p_quantity, p_unit_cost, p_reference_type, p_reference_id, p_notes
    ) RETURNING id INTO v_movement_id;

    -- Mettre à jour le stock
    INSERT INTO inventory_items (product_id, warehouse_id, quantity_on_hand, unit_cost, last_movement_date)
    VALUES (p_product_id, p_warehouse_id, v_new_stock, p_unit_cost, NOW())
    ON CONFLICT (product_id, product_variant_id, warehouse_id, location_id)
    DO UPDATE SET
        quantity_on_hand = v_new_stock,
        unit_cost = COALESCE(p_unit_cost, inventory_items.unit_cost),
        last_movement_date = NOW(),
        updated_at = NOW();

    RETURN JSONB_BUILD_OBJECT(
        'movement_id', v_movement_id,
        'previous_stock', v_current_stock,
        'new_stock', v_new_stock,
        'quantity_moved', p_quantity,
        'direction', v_direction
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_feature_usage_if_needed()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Vérifier s'il faut réinitialiser le compteur d'usage
    IF NEW.reset_period != 'never' AND NEW.last_reset_date IS NOT NULL THEN
        DECLARE
            reset_interval INTERVAL;
        BEGIN
            reset_interval := CASE NEW.reset_period
                WHEN 'daily' THEN '1 day'::INTERVAL
                WHEN 'weekly' THEN '7 days'::INTERVAL
                WHEN 'monthly' THEN '1 month'::INTERVAL
                WHEN 'yearly' THEN '1 year'::INTERVAL
                ELSE NULL
            END;

            IF reset_interval IS NOT NULL AND
               NEW.last_reset_date + reset_interval <= NOW() THEN
                NEW.current_usage = 0;
                NEW.last_reset_date = NOW();
            END IF;
        END;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.save_user_notifications(p_email_new_transactions boolean DEFAULT true, p_email_weekly_reports boolean DEFAULT true, p_email_system_updates boolean DEFAULT false, p_email_marketing boolean DEFAULT false, p_email_invoices boolean DEFAULT true, p_email_payments boolean DEFAULT true, p_email_reminders boolean DEFAULT true, p_push_new_transactions boolean DEFAULT false, p_push_alerts boolean DEFAULT true, p_push_reminders boolean DEFAULT true, p_push_system_updates boolean DEFAULT false, p_notification_frequency text DEFAULT 'daily'::text, p_quiet_hours_enabled boolean DEFAULT false, p_quiet_hours_start time without time zone DEFAULT '22:00:00'::time without time zone, p_quiet_hours_end time without time zone DEFAULT '08:00:00'::time without time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_uuid UUID := auth.uid();
BEGIN
  -- Validation des paramètres
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  IF p_notification_frequency NOT IN ('immediate', 'daily', 'weekly') THEN
    RAISE EXCEPTION 'Fréquence de notification invalide';
  END IF;

  -- Upsert des paramètres
  INSERT INTO user_notifications (
    user_id,
    email_new_transactions,
    email_weekly_reports,
    email_system_updates,
    email_marketing,
    email_invoices,
    email_payments,
    email_reminders,
    push_new_transactions,
    push_alerts,
    push_reminders,
    push_system_updates,
    notification_frequency,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end
  ) VALUES (
    user_uuid,
    p_email_new_transactions,
    p_email_weekly_reports,
    p_email_system_updates,
    p_email_marketing,
    p_email_invoices,
    p_email_payments,
    p_email_reminders,
    p_push_new_transactions,
    p_push_alerts,
    p_push_reminders,
    p_push_system_updates,
    p_notification_frequency,
    p_quiet_hours_enabled,
    p_quiet_hours_start,
    p_quiet_hours_end
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    email_new_transactions = EXCLUDED.email_new_transactions,
    email_weekly_reports = EXCLUDED.email_weekly_reports,
    email_system_updates = EXCLUDED.email_system_updates,
    email_marketing = EXCLUDED.email_marketing,
    email_invoices = EXCLUDED.email_invoices,
    email_payments = EXCLUDED.email_payments,
    email_reminders = EXCLUDED.email_reminders,
    push_new_transactions = EXCLUDED.push_new_transactions,
    push_alerts = EXCLUDED.push_alerts,
    push_reminders = EXCLUDED.push_reminders,
    push_system_updates = EXCLUDED.push_system_updates,
    notification_frequency = EXCLUDED.notification_frequency,
    quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
    quiet_hours_start = EXCLUDED.quiet_hours_start,
    quiet_hours_end = EXCLUDED.quiet_hours_end,
    updated_at = now();

  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_companies_intelligent(p_search_term text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, legal_name text, siret text, similarity_score numeric, data_quality_score integer, status text)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    normalized_search TEXT;
BEGIN
    normalized_search := normalize_company_name_safe(p_search_term);

    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.legal_name,
        c.siret,
        (
            CASE
                WHEN c.name ILIKE '%' || p_search_term || '%' THEN 90
                WHEN c.normalized_name = normalized_search THEN 85
                WHEN c.legal_name ILIKE '%' || p_search_term || '%' THEN 80
                WHEN c.siret LIKE '%' || REGEXP_REPLACE(p_search_term, '[^0-9]', '', 'g') || '%' THEN 75
                ELSE 50
            END +
            (COALESCE(c.data_quality_score, 0)::decimal / 100 * 10)
        )::DECIMAL(5,2) as sim_score,
        COALESCE(c.data_quality_score, 0),
        COALESCE(c.status, 'active')
    FROM companies c
    WHERE COALESCE(c.status, 'active') IN ('active', 'inactive')
    AND (
        c.name ILIKE '%' || p_search_term || '%'
        OR c.legal_name ILIKE '%' || p_search_term || '%'
        OR c.siret LIKE '%' || REGEXP_REPLACE(p_search_term, '[^0-9]', '', 'g') || '%'
        OR c.normalized_name = normalized_search
    )
    ORDER BY sim_score DESC, COALESCE(c.data_quality_score, 0) DESC
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_sectors(search_term text DEFAULT NULL::text, limit_param integer DEFAULT 20)
 RETURNS TABLE(sector_code text, sector_name text, category text, description text, common_modules text[], typical_size_ranges text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        s.sector_code,
        s.sector_name,
        s.category,
        s.description,
        s.common_modules,
        s.typical_size_ranges
    FROM sectors_catalog s
    WHERE s.is_active = true
    AND (
        search_term IS NULL
        OR s.sector_name ILIKE '%' || search_term || '%'
        OR s.description ILIKE '%' || search_term || '%'
        OR search_term = ANY(s.keywords)
    )
    ORDER BY s.priority_order, s.sector_name
    LIMIT limit_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_unified_third_parties(p_company_id uuid, p_search_term text DEFAULT NULL::text, p_party_type text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(party_type text, id uuid, party_number text, name text, email text, phone text, total_amount numeric, balance numeric, is_active boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        utp.party_type,
        utp.id,
        utp.party_number,
        utp.name,
        utp.email,
        utp.phone,
        utp.total_amount,
        utp.balance,
        utp.is_active
    FROM unified_third_parties_view utp
    WHERE utp.company_id = p_company_id
    AND (p_party_type IS NULL OR utp.party_type = p_party_type)
    AND (
        p_search_term IS NULL OR
        utp.name ILIKE '%' || p_search_term || '%' OR
        utp.email ILIKE '%' || p_search_term || '%' OR
        utp.party_number ILIKE '%' || p_search_term || '%' OR
        COALESCE(utp.company_name, '') ILIKE '%' || p_search_term || '%'
    )
    ORDER BY utp.name
    LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_companies_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Si owner_id change et created_by est NULL, définir created_by = owner_id
    IF NEW.owner_id IS NOT NULL AND OLD.created_by IS NULL THEN
        NEW.created_by = NEW.owner_id;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.transfer_company_ownership(p_company_id uuid, p_from_user_id uuid, p_to_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
BEGIN
    -- Vérifier que from_user est propriétaire
    IF NOT EXISTS (
        SELECT 1 FROM user_companies
        WHERE company_id = p_company_id
        AND user_id = p_from_user_id
        AND role = 'owner'
        AND is_active = true
    ) THEN
        RETURN json_build_object('success', false, 'error', 'User is not owner of this company');
    END IF;

    -- Vérifier que to_user a accès à l'entreprise
    IF NOT EXISTS (
        SELECT 1 FROM user_companies
        WHERE company_id = p_company_id
        AND user_id = p_to_user_id
        AND is_active = true
    ) THEN
        RETURN json_build_object('success', false, 'error', 'Target user does not have access to this company');
    END IF;

    -- Effectuer le transfert
    UPDATE user_companies
    SET role = 'owner', updated_at = NOW()
    WHERE company_id = p_company_id AND user_id = p_to_user_id;

    -- Rétrograder l'ancien propriétaire en admin
    UPDATE user_companies
    SET role = 'admin', updated_at = NOW()
    WHERE company_id = p_company_id AND user_id = p_from_user_id;

    -- Log de l'activité
    INSERT INTO user_activity_log (user_id, company_id, action, details)
    VALUES (
        p_from_user_id,
        p_company_id,
        'transfer_ownership',
        json_build_object('transferred_to', p_to_user_id, 'timestamp', NOW())
    );

    RETURN json_build_object('success', true, 'message', 'Ownership transferred successfully');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_bank_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_contract_billing_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_contract_kpis_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_contract_renewals_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_contract_terminations_updated()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_contracts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_hr_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_project_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    IF TG_TABLE_NAME IN ('project_tasks', 'project_members', 'project_timesheets', 'project_categories', 'project_templates', 'project_phases', 'project_milestones', 'task_comments', 'task_attachments', 'project_discussions', 'project_resources', 'resource_allocations', 'project_schedules', 'project_budgets', 'project_expenses', 'project_billing_rates', 'task_checklists') THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_update_quote_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_quote_totals(OLD.quote_id);
        RETURN OLD;
    ELSE
        PERFORM update_quote_totals(NEW.quote_id);
        RETURN NEW;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_account_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Mettre à jour le solde du compte
        UPDATE chart_of_accounts
        SET
            current_balance = current_balance + NEW.credit_amount - NEW.debit_amount,
            balance_credit = balance_credit + NEW.credit_amount,
            balance_debit = balance_debit + NEW.debit_amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Annuler l'effet de la ligne supprimée
        UPDATE chart_of_accounts
        SET
            current_balance = current_balance - OLD.credit_amount + OLD.debit_amount,
            balance_credit = balance_credit - OLD.credit_amount,
            balance_debit = balance_debit - OLD.debit_amount,
            updated_at = NOW()
        WHERE id = OLD.account_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_budget_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_client()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE crm_clients SET
        name = NEW.name,
        type = COALESCE(NEW.type, type),
        status = COALESCE(NEW.status, status),
        primary_contact_name = NEW.contact_name,
        primary_contact_email = NEW.email,
        primary_contact_phone = NEW.phone,
        industry = NEW.industry,
        website = NEW.website,
        total_value = COALESCE(NEW.total_value, total_value),
        tier = COALESCE(NEW.tier, tier),
        health_score = COALESCE(NEW.health_score, health_score),
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_client_from_view()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE crm_clients SET
        name = NEW.name,
        type = NEW.type,
        status = NEW.status,
        primary_contact_name = NEW.contact_name,
        primary_contact_email = NEW.email,
        primary_contact_phone = NEW.phone,
        industry = NEW.industry,
        website = NEW.website,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_commercial_action()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE crm_activities SET
        subject = NEW.title,
        description = NEW.description,
        type = COALESCE(NEW.type, type),
        status = COALESCE(NEW.status, status),
        due_date = NEW.due_date,
        priority = COALESCE(NEW.priority, priority),
        opportunity_id = NEW.opportunity_id,
        client_id = NEW.client_id,
        lead_id = NEW.lead_id,
        assigned_to = NEW.assigned_to,
        outcome = NEW.outcome,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_features_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_by = auth.uid();

    -- Ajouter à l'historique des modifications
    NEW.modification_history = COALESCE(OLD.modification_history, '[]'::jsonb) ||
        jsonb_build_object(
            'timestamp', NOW(),
            'user_id', auth.uid(),
            'action', TG_OP,
            'changes', CASE
                WHEN TG_OP = 'UPDATE' THEN
                    jsonb_build_object(
                        'is_enabled', jsonb_build_object('from', OLD.is_enabled, 'to', NEW.is_enabled),
                        'configuration', jsonb_build_object('from', OLD.configuration, 'to', NEW.configuration)
                    )
                ELSE jsonb_build_object('created', true)
            END
        );

    -- Gérer les timestamps d'activation/désactivation
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_enabled = false AND NEW.is_enabled = true THEN
            NEW.enabled_at = NOW();
            NEW.enabled_by = auth.uid();
            NEW.disabled_at = NULL;
            NEW.disabled_by = NULL;
            NEW.disable_reason = NULL;
        ELSIF OLD.is_enabled = true AND NEW.is_enabled = false THEN
            NEW.disabled_at = NOW();
            NEW.disabled_by = auth.uid();
        END IF;
    ELSIF TG_OP = 'INSERT' AND NEW.is_enabled = true THEN
        NEW.enabled_at = NOW();
        NEW.enabled_by = auth.uid();
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_governance_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Normalisation nom (existant)
    NEW.normalized_name := normalize_company_name_safe(NEW.name);

    -- Business key (existant)
    IF NEW.business_key IS NULL THEN
        NEW.business_key := COALESCE(NEW.siret, NEW.siren, 'BK_' || NEW.id::text);
    END IF;

    -- ========================================
    -- SCORE DE QUALITÉ ÉTENDU AVEC NOUVEAUX CHAMPS
    -- ========================================
    NEW.data_quality_score := (
        -- Champs existants (75 points max)
        CASE WHEN NEW.name IS NOT NULL AND LENGTH(TRIM(NEW.name)) > 0 THEN 25 ELSE 0 END +
        CASE WHEN NEW.siret IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.siret, '[^0-9]', '', 'g')) = 14 THEN 20 ELSE 0 END +
        CASE WHEN NEW.postal_code IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.city IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.legal_name IS NOT NULL THEN 10 ELSE 0 END +

        -- Nouveaux champs CompanyStep (25 points max)
        CASE WHEN NEW.ceo_name IS NOT NULL AND LENGTH(TRIM(NEW.ceo_name)) > 0 THEN 8 ELSE 0 END +
        CASE WHEN NEW.sector IS NOT NULL THEN 7 ELSE 0 END +
        CASE WHEN NEW.industry_type IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN NEW.company_size IS NOT NULL THEN 3 ELSE 0 END +
        CASE WHEN NEW.registration_date IS NOT NULL THEN 2 ELSE 0 END
    );

    -- Dates (existant)
    NEW.last_validation_date := NOW();
    NEW.updated_at := NOW();

    -- Status par défaut (existant)
    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_governance_manual(p_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    company_rec RECORD;
BEGIN
    SELECT * INTO company_rec FROM companies WHERE id = p_company_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE companies
    SET
        normalized_name = normalize_company_name_safe(name),
        business_key = COALESCE(siret, siren, 'BK_' || id::text),
        data_quality_score = (
            CASE WHEN name IS NOT NULL AND LENGTH(TRIM(name)) > 0 THEN 30 ELSE 0 END +
            CASE WHEN siret IS NOT NULL AND LENGTH(REGEXP_REPLACE(siret, '[^0-9]', '', 'g')) = 14 THEN 25 ELSE 0 END +
            CASE WHEN postal_code IS NOT NULL THEN 15 ELSE 0 END +
            CASE WHEN city IS NOT NULL THEN 15 ELSE 0 END +
            CASE WHEN legal_name IS NOT NULL THEN 15 ELSE 0 END
        ),
        last_validation_date = NOW(),
        status = COALESCE(status, 'active'),
        is_active = COALESCE(is_active, true),
        updated_at = NOW()
    WHERE id = p_company_id;

    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_company_modules_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();

    -- Gérer l'activation automatique
    IF TG_OP = 'UPDATE' AND OLD.is_enabled = false AND NEW.is_enabled = true THEN
        NEW.activated_at = NOW();
        NEW.activated_by = auth.uid();
    END IF;

    -- Mise à jour usage_count si applicable
    IF TG_OP = 'UPDATE' AND NEW.last_used_at > COALESCE(OLD.last_used_at, '1970-01-01'::timestamptz) THEN
        NEW.usage_count = COALESCE(OLD.usage_count, 0) + 1;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_crm_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_fiscal_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_journal_entry_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        UPDATE journal_entries
        SET
            total_debit = (
                SELECT COALESCE(SUM(debit_amount), 0)
                FROM journal_entry_lines
                WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
            ),
            total_credit = (
                SELECT COALESCE(SUM(credit_amount), 0)
                FROM journal_entry_lines
                WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
            ),
            updated_at = NOW()
        WHERE id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_onboarding_session_progress()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_session_record RECORD;
    v_completed_count INTEGER;
BEGIN
    -- Chercher la session correspondante si session_id fourni
    IF NEW.session_id IS NOT NULL THEN
        SELECT * INTO v_session_record
        FROM onboarding_sessions
        WHERE session_token = NEW.session_id
        AND company_id = NEW.company_id
        AND user_id = NEW.user_id;

        IF FOUND THEN
            -- Compter les étapes complétées
            SELECT COUNT(*) INTO v_completed_count
            FROM onboarding_history
            WHERE session_id = NEW.session_id
            AND completion_status = 'completed';

            -- Mettre à jour la session
            UPDATE onboarding_sessions SET
                completed_steps = v_completed_count,
                current_step = CASE
                    WHEN NEW.completion_status = 'completed' AND NEW.step_name = 'complete' THEN 'complete'
                    WHEN NEW.completion_status = 'completed' THEN NEW.step_name
                    ELSE current_step
                END,
                final_status = CASE
                    WHEN NEW.step_name = 'complete' AND NEW.completion_status = 'completed' THEN 'completed'
                    WHEN NEW.completion_status = 'error' THEN 'error'
                    WHEN NEW.completion_status = 'abandoned' THEN 'abandoned'
                    ELSE 'in_progress'
                END,
                completed_at = CASE
                    WHEN NEW.step_name = 'complete' AND NEW.completion_status = 'completed' THEN NOW()
                    ELSE completed_at
                END,
                updated_at = NOW()
            WHERE id = v_session_record.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_onboarding_sessions_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_opportunity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE crm_opportunities SET
        title = NEW.title,
        description = NEW.description,
        value = COALESCE(NEW.value, value),
        probability = COALESCE(NEW.probability, probability),
        expected_close_date = NEW.close_date,
        status = COALESCE(NEW.status, status),
        source = NEW.source,
        client_id = NEW.client_id,
        owner_id = NEW.assigned_to,
        stage_id = NEW.stage_id,
        pipeline_id = NEW.pipeline_id,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_purchase_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Mettre à jour les totaux de la commande
    UPDATE purchases
    SET
        subtotal_amount = (calc.totals->>'subtotal_amount')::DECIMAL,
        tax_amount = (calc.totals->>'tax_amount')::DECIMAL,
        discount_amount = (calc.totals->>'discount_amount')::DECIMAL,
        total_amount = (calc.totals->>'total_amount')::DECIMAL,
        updated_at = NOW()
    FROM (
        SELECT calculate_purchase_totals(COALESCE(NEW.purchase_id, OLD.purchase_id)) as totals
    ) calc
    WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);

    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_quote_totals(p_quote_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_subtotal DECIMAL(15,2);
    v_tax_amount DECIMAL(15,2);
    v_total DECIMAL(15,2);
BEGIN
    -- Calculer les totaux depuis les lignes
    SELECT
        COALESCE(SUM(line_total), 0),
        COALESCE(SUM(line_total * tax_rate / 100), 0)
    INTO v_subtotal, v_tax_amount
    FROM quote_items
    WHERE quote_id = p_quote_id;

    v_total := v_subtotal + v_tax_amount;

    -- Mettre à jour le devis
    UPDATE quotes
    SET
        subtotal_amount = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total,
        updated_at = NOW()
    WHERE id = p_quote_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_referentials_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_stripe_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timestamp_facturation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_companies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_last_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE user_companies
    SET last_activity = NOW()
    WHERE user_id = NEW.user_id AND company_id = NEW.company_id;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_notifications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_preferences_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_company_step_data(p_name text, p_sector text DEFAULT NULL::text, p_company_size text DEFAULT NULL::text, p_share_capital numeric DEFAULT NULL::numeric, p_ceo_name text DEFAULT NULL::text, p_timezone text DEFAULT NULL::text)
 RETURNS TABLE(is_valid boolean, errors text[], warnings text[], quality_score integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_errors TEXT[] := '{}';
    v_warnings TEXT[] := '{}';
    v_score INTEGER := 0;
BEGIN
    -- Validation obligatoire: nom
    IF p_name IS NULL OR LENGTH(TRIM(p_name)) < 2 THEN
        v_errors := array_append(v_errors, 'Le nom de l''entreprise est requis (minimum 2 caractères)');
    ELSE
        v_score := v_score + 25;
    END IF;

    -- Validation optionnelle avec warnings
    IF p_sector IS NOT NULL THEN
        v_score := v_score + 7;
    ELSE
        v_warnings := array_append(v_warnings, 'Secteur d''activité non renseigné');
    END IF;

    IF p_company_size IS NOT NULL THEN
        IF p_company_size NOT IN ('startup', 'small', 'medium', 'large', 'enterprise') THEN
            v_errors := array_append(v_errors, 'Taille d''entreprise invalide');
        ELSE
            v_score := v_score + 3;
        END IF;
    END IF;

    IF p_share_capital IS NOT NULL THEN
        IF p_share_capital < 0 THEN
            v_errors := array_append(v_errors, 'Le capital social ne peut pas être négatif');
        ELSE
            v_score := v_score + 5;
        END IF;
    END IF;

    IF p_ceo_name IS NOT NULL AND LENGTH(TRIM(p_ceo_name)) > 0 THEN
        v_score := v_score + 8;
    END IF;

    IF p_timezone IS NOT NULL AND p_timezone !~ '^[A-Za-z_]+/[A-Za-z_]+$' THEN
        v_errors := array_append(v_errors, 'Format de timezone invalide');
    END IF;

    RETURN QUERY
    SELECT
        array_length(v_errors, 1) IS NULL,
        v_errors,
        v_warnings,
        v_score;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_user_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Validation timezone
    IF NEW.timezone IS NOT NULL AND NEW.timezone !~ '^[A-Za-z_]+/[A-Za-z_]+$' THEN
        RAISE EXCEPTION 'Invalid timezone format: %', NEW.timezone;
    END IF;

    -- Validation currency (format ISO)
    IF NEW.currency IS NOT NULL AND LENGTH(NEW.currency) != 3 THEN
        RAISE EXCEPTION 'Currency must be 3 characters ISO code: %', NEW.currency;
    END IF;

    -- Validation fiscal_year_start format
    IF NEW.fiscal_year_start IS NOT NULL AND NEW.fiscal_year_start !~ '^[0-9]{2}/[0-9]{2}$' THEN
        RAISE EXCEPTION 'Fiscal year start must be in DD/MM format: %', NEW.fiscal_year_start;
    END IF;

    RETURN NEW;
END;
$function$
;



  create policy "Avatars are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



