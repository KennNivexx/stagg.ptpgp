DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor' AND column_name='name') THEN
    ALTER TABLE vendor DROP COLUMN name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor' AND column_name='email') THEN
    ALTER TABLE vendor DROP COLUMN email;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor' AND column_name='phone') THEN
    ALTER TABLE vendor DROP COLUMN phone;
  END IF;
END $$;
