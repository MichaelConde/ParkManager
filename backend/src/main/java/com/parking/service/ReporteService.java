package com.parking.service;

import com.parking.domain.EstadoPlaza;
import com.parking.domain.MetodoPago;
import com.parking.domain.Pago;
import com.parking.domain.TipoVehiculo;
import com.parking.dto.*;
import com.parking.repository.PagoRepository;
import com.parking.repository.PlazaRepository;
import com.parking.repository.SesionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReporteService {

    private final PagoRepository pagoRepository;
    private final SesionRepository sesionRepository;
    private final PlazaRepository plazaRepository;

    public ReporteIngresosResponse reporteIngresos(LocalDate desde, LocalDate hasta) {
        LocalDateTime inicio = desde.atStartOfDay();
        LocalDateTime fin = hasta.atTime(23, 59, 59);

        List<Pago> pagos = pagoRepository.findEntreFechas(inicio, fin);

        BigDecimal total = pagos.stream().map(Pago::getMonto).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> porMetodoReal = new LinkedHashMap<>();
        for (MetodoPago metodo : MetodoPago.values()) {
            BigDecimal suma = pagos.stream()
                    .filter(p -> p.getMetodo() == metodo)
                    .map(Pago::getMonto)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            porMetodoReal.put(metodo.name(), suma);
        }

        Map<LocalDate, List<Pago>> agrupadoPorDia = pagos.stream()
                .collect(Collectors.groupingBy(p -> p.getFechaPago().toLocalDate()));

        List<IngresoDiaDto> porDia = agrupadoPorDia.entrySet().stream()
                .map(e -> new IngresoDiaDto(
                        e.getKey(),
                        e.getValue().stream().map(Pago::getMonto).reduce(BigDecimal.ZERO, BigDecimal::add),
                        e.getValue().size()))
                .sorted(Comparator.comparing(IngresoDiaDto::fecha))
                .toList();

        return new ReporteIngresosResponse(desde, hasta, total, pagos.size(), porMetodoReal, porDia);
    }

    public ReporteOcupacionResponse reporteOcupacion(LocalDate desde, LocalDate hasta) {
        List<OcupacionTipoDto> porTipo = new ArrayList<>();
        for (TipoVehiculo tipo : TipoVehiculo.values()) {
            long total = plazaRepository.countByTipo(tipo);
            long ocupadas = plazaRepository.countByTipoAndEstado(tipo, EstadoPlaza.OCUPADA);
            long libres = total - ocupadas;
            double porcentaje = total == 0 ? 0.0 : (ocupadas * 100.0) / total;
            porTipo.add(new OcupacionTipoDto(tipo.name(), total, ocupadas, libres, Math.round(porcentaje * 10.0) / 10.0));
        }

        LocalDateTime inicio = desde.atStartOfDay();
        LocalDateTime fin = hasta.atTime(23, 59, 59);
        List<PlazaUsoDto> plazasMasUsadas = sesionRepository.findPlazasMasUsadas(inicio, fin).stream()
                .map(p -> new PlazaUsoDto(p.getCodigo(), p.getTotal()))
                .limit(10)
                .toList();

        long sesionesActivas = sesionRepository.countByEstado(com.parking.domain.EstadoSesion.ACTIVA);

        return new ReporteOcupacionResponse(porTipo, plazasMasUsadas, sesionesActivas);
    }

    public byte[] exportarIngresosExcel(LocalDate desde, LocalDate hasta) {
        ReporteIngresosResponse reporte = reporteIngresos(desde, hasta);
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ingresos");
            CellStyle headerStyle = workbook.createCellStyle();
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            headerStyle.setFont(boldFont);

            int rowIdx = 0;
            Row title = sheet.createRow(rowIdx++);
            title.createCell(0).setCellValue("Reporte de ingresos: " + desde.format(fmt) + " a " + hasta.format(fmt));

            rowIdx++;
            Row header = sheet.createRow(rowIdx++);
            String[] columnas = {"Fecha", "Total del dia", "Sesiones"};
            for (int i = 0; i < columnas.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columnas[i]);
                cell.setCellStyle(headerStyle);
            }

            for (IngresoDiaDto dia : reporte.porDia()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(dia.fecha().format(fmt));
                row.createCell(1).setCellValue(dia.total().doubleValue());
                row.createCell(2).setCellValue(dia.sesiones());
            }

            rowIdx++;
            Row totalRow = sheet.createRow(rowIdx++);
            totalRow.createCell(0).setCellValue("TOTAL");
            totalRow.createCell(1).setCellValue(reporte.totalIngresos().doubleValue());
            totalRow.createCell(2).setCellValue(reporte.totalSesiones());

            rowIdx += 2;
            Row metodoHeader = sheet.createRow(rowIdx++);
            metodoHeader.createCell(0).setCellValue("Metodo de pago");
            metodoHeader.createCell(1).setCellValue("Total");
            for (Map.Entry<String, BigDecimal> entry : reporte.porMetodoPago().entrySet()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(entry.getKey());
                row.createCell(1).setCellValue(entry.getValue().doubleValue());
            }

            for (int i = 0; i < columnas.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el archivo Excel", e);
        }
    }
}
