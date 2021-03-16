const getCreateTableScript = (name) => {
    return `CREATE TABLE ${name}
(
    username character varying(128) COLLATE pg_catalog."default",
    username_jp character varying(128) COLLATE pg_catalog."default",
    email character varying(256) COLLATE pg_catalog."default",
    company_name character varying(128) COLLATE pg_catalog."default",
    title character varying(128) COLLATE pg_catalog."default",
    category character varying(512) COLLATE pg_catalog."default",
    industry character varying(512) COLLATE pg_catalog."default",
    fb_url character varying(256) COLLATE pg_catalog."default",
    profile_img character varying(128) COLLATE pg_catalog."default",
    channels character varying(64)[] COLLATE pg_catalog."default",
    profile_check boolean NOT NULL DEFAULT false,
    photo_check boolean NOT NULL DEFAULT false,
    userrole character varying(32) COLLATE pg_catalog."default",
    CONSTRAINT ${name}_email_key UNIQUE (email),
    CONSTRAINT ${name}_email_key1 UNIQUE (email),
    CONSTRAINT ${name}_email_key2 UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE public.${name}
    OWNER to postgres;
`
}

module.exports = {
    getCreateTableScript: getCreateTableScript
}