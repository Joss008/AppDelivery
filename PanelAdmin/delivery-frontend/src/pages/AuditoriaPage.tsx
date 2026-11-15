import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { auditoriaApi } from '../api';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Button, Table, type TableColumn } from '../components/ui';
import type { RegistroAuditoriaResponse } from '../types';

export function AuditoriaPage() {
  const auditoriaQuery = useQuery({
    queryKey: ['auditoria'],
    queryFn: async () => {
      try {
        return await auditoriaApi.listar();
      } catch {
        return [] as RegistroAuditoriaResponse[];
      }
    },
  });

  const registros = auditoriaQuery.data ?? [];

  const columns: TableColumn<RegistroAuditoriaResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      numeric: true,
      render: (item) => (
        <span className="font-medium text-slate-900">#{item.id}</span>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuario responsable',
      render: (item) => (
        <span className="font-medium text-slate-900">
          {item.nombreUsuario || `Usuario #${item.usuarioId}`}
        </span>
      ),
    },
    {
      key: 'accion',
      header: 'Acción',
      render: (item) => <Badge tone="info">{item.accion}</Badge>,
    },
    {
      key: 'descripcion',
      header: 'Descripción del evento',
      render: (item) => (
        <span className="text-slate-700">{item.descripcion}</span>
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
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de auditoría"
        description="Historial de acciones administrativas y eventos relevantes del sistema."
        actions={
          <Button
            variant="secondary"
            onClick={() => void auditoriaQuery.refetch()}
            loading={auditoriaQuery.isFetching}
            leftIcon={<RefreshCw className="h-4 w-4" strokeWidth={1.75} />}
          >
            Actualizar
          </Button>
        }
      />

      <Table
        data={registros}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={auditoriaQuery.isLoading}
        emptyTitle="Sin registros de auditoría"
        emptyDescription="Los eventos administrativos aparecerán listados cronológicamente aquí."
      />
    </div>
  );
}
