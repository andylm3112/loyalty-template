-- =====================================================
-- SEED SQL — Template de Loyalty App
-- Reemplaza los {{VAR}} antes de ejecutar en Supabase
-- =====================================================

-- Insertar negocio
INSERT INTO negocios (
  nombre, slogan, color_primario, color_secundario, fuente,
  puntos_meta, dias_expiracion, whatsapp, instagram
) VALUES (
  '{{NOMBRE_NEGOCIO}}',
  '{{SLOGAN}}',
  '{{COLOR_PRIMARIO}}',
  '{{COLOR_SECUNDARIO}}',
  'Inter',
  {{PUNTOS_META}},
  30,
  '{{WHATSAPP}}',
  '{{INSTAGRAM}}'
);

-- Insertar cupones (array de objetos, uno por fila)
-- {{CUPONES_JSON}} se reemplaza por una o más sentencias INSERT como esta,
-- generadas dinámicamente por el Builder a partir del formulario:
--
-- INSERT INTO cupones (negocio_id, nombre, descripcion, tipo, visita_requerida, dias_validez)
-- VALUES (
--   (SELECT id FROM negocios WHERE nombre = '{{NOMBRE_NEGOCIO}}'),
--   '<nombre_cupon>',
--   '<descripcion_cupon>',
--   '<tipo_cupon>',       -- 'porcentaje' | 'producto_gratis' | '2x1' | 'sorpresa'
--   <visita_requerida>,
--   30
-- );

{{CUPONES_JSON}}

-- Insertar administrador dueño (opcional, si el formulario lo incluye)
-- INSERT INTO administradores (negocio_id, email, telefono, rol)
-- VALUES (
--   (SELECT id FROM negocios WHERE nombre = '{{NOMBRE_NEGOCIO}}'),
--   '{{EMAIL_DUENO}}',
--   '{{TELEFONO_DUENO}}',
--   'dueño'
-- );
