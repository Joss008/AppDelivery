import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { alertasApi } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Button,
  Table,
  type BadgeTone,
  type TableColumn,
} from '../components/ui';
import type { AlertaFraudeResponse, SeveridadAlerta } from '../types';

const SEVERIDAD_TONE: Record<SeveridadAlerta, BadgeTone> = {
  BAJA: 'neutral',
  MEDIA: 'info',
  ALTA: 'warning',
  CRITICA: 'danger',
};

export function AlertasPage() {
  const queryClient = useQueryClient();

  const alertasQuery = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      try {
        return await alertasApi.listar();
      } catch {
        return [] as AlertaFraudeResponse[];
      }
    },
  });

  const resolverMutation = useMutation({
    mutationFn: (id: number) => alertasApi.resolver(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  const alertas = alertasQuery.data ?? [];

  const columns: TableColumn<AlertaFraudeResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">#{item.id}</span>
      ),
    },
    {
      key: 'severidad',
      header: 'Severidad',
      render: (item) => (
        <Badge tone={SEVERIDAD_TONE[item.severidad] ?? 'neutral'} dot>
          {item.severidad}
        </Badge>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo / Descripción',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.tipo}</p>
          <p className="text-xs text-slate-500">{item.descripcion}</p>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      numeric: true,
      render: (item) => (
        <span className="text-xs text-slate-500">{item.fecha}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item) => (
        <Badge tone={item.resuelta ? 'success' : 'warning'} dot>
          {item.resuelta ? 'Resuelta' : 'Pendiente'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acción',
      align: 'right',
      render: (item) =>
        !item.resuelta ? (
          <Button
            size="sm"
            variant="secondary"
            loading={
              resolverMutation.isPending &&
              resolverMutation.variables === item.id
            }
            onClick={() => resolverMutation.mutate(item.id)}
            leftIcon={
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            }
          >
            Marcar resuelta
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas de fraude"
        description="Monitoreo de eventos sospechosos y anomalías operativas detectadas en la plataforma."
        actions={
          <Button
            variant="secondary"
            onClick={() => void alertasQuery.refetch()}
            loading={alertasQuery.isFetching}
            leftIcon={<RefreshCw className="h-4 w-4" strokeWidth={1.75} />}
          >
            Actualizar
          </Button>
        }
      />

      <Table
        data={alertas}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={alertasQuery.isLoading}
        emptyTitle="Sin alertas activas"
        emptyDescription="No se han registrado alertas ni eventos sospechosos en el sistema."
      />
    </div>
  );
}
