Eliminar evaluaciones de administradores (En_proceso y Completada)

USE nom035_db;
GO

BEGIN TRANSACTION;
BEGIN TRY
    DELETE FROM RESPUESTA WHERE id_evaluacion IN (
        SELECT e.id_evaluacion FROM EVALUACION e
        JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        JOIN USUARIO u ON u.id_empleado = emp.id_empleado
        WHERE u.id_rol = 1 AND e.estatus IN ('En_proceso', 'Completada')
    );

    DELETE FROM RESPUESTA_GUIA_I WHERE id_evaluacion IN (
        SELECT e.id_evaluacion FROM EVALUACION e
        JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        JOIN USUARIO u ON u.id_empleado = emp.id_empleado
        WHERE u.id_rol = 1 AND e.estatus IN ('En_proceso', 'Completada')
    );

    DELETE FROM RESULTADO_GLOBAL WHERE id_evaluacion IN (
        SELECT e.id_evaluacion FROM EVALUACION e
        JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        JOIN USUARIO u ON u.id_empleado = emp.id_empleado
        WHERE u.id_rol = 1 AND e.estatus IN ('En_proceso', 'Completada')
    );

    DELETE FROM RESULTADO_CATEGORIA WHERE id_evaluacion IN (
        SELECT e.id_evaluacion FROM EVALUACION e
        JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        JOIN USUARIO u ON u.id_empleado = emp.id_empleado
        WHERE u.id_rol = 1 AND e.estatus IN ('En_proceso', 'Completada')
    );

    DELETE FROM RESULTADO_DOMINIO WHERE id_evaluacion IN (
        SELECT e.id_evaluacion FROM EVALUACION e
        JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        JOIN USUARIO u ON u.id_empleado = emp.id_empleado
        WHERE u.id_rol = 1 AND e.estatus IN ('En_proceso', 'Completada')
    );

    DELETE FROM EVALUACION
    WHERE id_empleado IN (
        SELECT emp.id_empleado FROM EMPLEADO emp
        JOIN USUARIO u ON u.id_empleado = emp.id_empleado
        WHERE u.id_rol = 1
    )
    AND estatus IN ('En_proceso', 'Completada');

    COMMIT TRANSACTION;
    PRINT '✅ Evaluaciones de administradores eliminadas.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '❌ Error: ' + ERROR_MESSAGE();
END CATCH;
GO

///////////////////////////////////////////////////////////////////////////////7

 Eliminar evaluaciones En_proceso con más de 30 días de antigüedad


USE nom035_db;
GO

BEGIN TRANSACTION;
BEGIN TRY
    DELETE FROM RESPUESTA WHERE id_evaluacion IN (
        SELECT id_evaluacion FROM EVALUACION
        WHERE estatus = 'En_proceso' AND fecha_aplicacion < DATEADD(DAY, -30, GETDATE())
    );

    DELETE FROM RESPUESTA_GUIA_I WHERE id_evaluacion IN (
        SELECT id_evaluacion FROM EVALUACION
        WHERE estatus = 'En_proceso' AND fecha_aplicacion < DATEADD(DAY, -30, GETDATE())
    );

    DELETE FROM RESULTADO_GLOBAL WHERE id_evaluacion IN (
        SELECT id_evaluacion FROM EVALUACION
        WHERE estatus = 'En_proceso' AND fecha_aplicacion < DATEADD(DAY, -30, GETDATE())
    );

    DELETE FROM RESULTADO_CATEGORIA WHERE id_evaluacion IN (
        SELECT id_evaluacion FROM EVALUACION
        WHERE estatus = 'En_proceso' AND fecha_aplicacion < DATEADD(DAY, -30, GETDATE())
    );

    DELETE FROM RESULTADO_DOMINIO WHERE id_evaluacion IN (
        SELECT id_evaluacion FROM EVALUACION
        WHERE estatus = 'En_proceso' AND fecha_aplicacion < DATEADD(DAY, -30, GETDATE())
    );

    DELETE FROM EVALUACION
    WHERE estatus = 'En_proceso' AND fecha_aplicacion < DATEADD(DAY, -30, GETDATE());

    COMMIT TRANSACTION;
    PRINT '✅ Evaluaciones en proceso antiguas eliminadas.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '❌ Error: ' + ERROR_MESSAGE();
END CATCH;
GO