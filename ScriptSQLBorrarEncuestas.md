USE nom035_db;
GO

BEGIN TRANSACTION;
BEGIN TRY
    -- 1. Desvincular usuarios de empleados de prueba
    UPDATE USUARIO
    SET id_empleado = NULL
    WHERE id_empleado IN (
        SELECT id_empleado
        FROM EMPLEADO
        WHERE email LIKE 'test%@nom035.com'
    );

    -- 2. Eliminar respuestas y resultados de evaluaciones de empleados de prueba
    DELETE FROM RESPUESTA
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        INNER JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.email LIKE 'test%@nom035.com'
    );

    DELETE FROM RESPUESTA_GUIA_I
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        INNER JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.email LIKE 'test%@nom035.com'
    );

    DELETE FROM RESULTADO_GLOBAL
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        INNER JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.email LIKE 'test%@nom035.com'
    );

    DELETE FROM RESULTADO_CATEGORIA
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        INNER JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.email LIKE 'test%@nom035.com'
    );

    DELETE FROM RESULTADO_DOMINIO
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        INNER JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.email LIKE 'test%@nom035.com'
    );

    -- 3. Eliminar evaluaciones de empleados de prueba
    DELETE FROM EVALUACION
    WHERE id_empleado IN (
        SELECT id_empleado
        FROM EMPLEADO
        WHERE email LIKE 'test%@nom035.com'
    );

    -- 4. Eliminar empleados de prueba
    DELETE FROM EMPLEADO
    WHERE email LIKE 'test%@nom035.com';

    -- 5. Eliminar usuarios de prueba
    DELETE FROM USUARIO
    WHERE email LIKE 'test%@nom035.com';

    -- 6. Opcional: eliminar canalizaciones huérfanas (sin empleado)
    DELETE FROM RESPUESTA
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        LEFT JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.id_empleado IS NULL
    );

    DELETE FROM RESPUESTA_GUIA_I
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        LEFT JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.id_empleado IS NULL
    );

    DELETE FROM RESULTADO_GLOBAL
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        LEFT JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.id_empleado IS NULL
    );

    DELETE FROM RESULTADO_CATEGORIA
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        LEFT JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.id_empleado IS NULL
    );

    DELETE FROM RESULTADO_DOMINIO
    WHERE id_evaluacion IN (
        SELECT e.id_evaluacion
        FROM EVALUACION e
        LEFT JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.id_empleado IS NULL
    );

    DELETE FROM EVALUACION
    WHERE id_empleado IN (
        SELECT e.id_empleado
        FROM EVALUACION e
        LEFT JOIN EMPLEADO emp ON e.id_empleado = emp.id_empleado
        WHERE emp.id_empleado IS NULL
    );

    COMMIT TRANSACTION;
    PRINT '✅ Revertido: usuarios de prueba y datos asociados eliminados.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '❌ Error: ' + ERROR_MESSAGE();
END CATCH;
GO