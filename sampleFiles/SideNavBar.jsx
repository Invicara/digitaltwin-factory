import React, { useState } from "react"
import { makeStyles, Accordion, AccordionSummary, AccordionDetails } from "@material-ui/core"

const useStyles = makeStyles((theme) => ({
    sideBarContainer: {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: `-80px`,
        zIndex: 11,
        width: theme.spacing(6),
        height: '100vh',
        background: '#002646',
        '& button': {
            background: 'none'
        }
    },
    toggle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: theme.spacing(7),
        height: theme.spacing(7),
        border: 0,
        color: 'whitesmoke'
    },
    menu: props => ({
        overflow: 'auto',
        width: props.menuOpen || props.menuStayOpen ? theme.spacing(32) : theme.spacing(6),
        height: '100vh',
        background: '#002646',
        transition: 'width 0.1s ease'
    }),
    innerMenu: {
        minWidth: theme.spacing(32)
    },
    group: {
        display: 'flex',
        alignItems: 'flex-start',
        '& .MuiAccordionSummary-root': {
            paddingLeft: 0
        },
        '& .MuiAccordionDetails-root': {
            flexDirection: 'column',
            padding: 0
        },
        '&.selected .MuiAccordionSummary-root': {
            backgroundColor: '#002646'
        }
    },
    accordion: {
        width: `calc(100% + ${theme.spacing(6)}px)`,
        background: '#002646',
        boxShadow: 'none',
        '& .MuiAccordionSummary-content': {
            margin: 0
        },
        '&.Mui-expanded': {
            margin: 0
        },
        '& .Mui-expanded': {
            alignItems: 'center',
            minHeight: theme.spacing(6)
        }
    },
    accordionHeading: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        color: 'white'
    },
    iconWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: theme.spacing(6),
        width: theme.spacing(6),
        height: theme.spacing(6)
    },
    icon: {
        padding: 0,
        color: 'whitesmoke',
        '&.fas': {
            fontSize: 20
        }
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: theme.spacing(6),
        paddingLeft: theme.spacing(6),
        fontSize: 12,
        color: 'white',
        '&:hover': {
            color: 'white',
            textDecoration: 'none',
            backgroundColor: '#004a87',
        },
        '&.selected': {
            backgroundColor: '#004a87',
            boxShadow: `${theme.spacing(0.5)}px 0 black} inset`
        }
    }
}))

const SidebarNav = ({ router }) => {
    const [menuStayOpen, setMenuStayOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [accordionState, setAccordionState] = useState({})
    const classes = useStyles({ menuOpen, menuStayOpen })

    const handleClick = (group, expanded) => {
        setAccordionState(prev => { return {...prev, [group.groupName]: expanded }})
    }

    return (
        <div className={classes.sideBarContainer}>
            <button className={classes.toggle} onClick={() => setMenuStayOpen((prev) => !prev)}>
                {menuStayOpen ? <i className='fas fa-times' alt="Close menu icon"></i> : <i className='fas fa-bars' alt="Open menu icon"></i>}
            </button>
            <div
                className={classes.menu}
                onMouseEnter={() => { if (!menuStayOpen) setMenuOpen(true)} }
                onMouseLeave={() => { if (!menuStayOpen) setMenuOpen(false)} }
            >
                <div className={classes.innerMenu}>
                    {router?.pageGroups?.length > 0 && router.pageGroups.map((group) => (
                        <div key={group.groupName} className={`${classes.group} ${group.items.find(item => `#${item.path}` == location.hash ) ? 'selected' : ''}`}>
                            <Accordion
                                className={classes.accordion}
                                expanded={!menuStayOpen && !menuOpen ? false : accordionState[group.groupName] || null}
                                onChange={(e, expanded) => handleClick(group, expanded)}>
                                <AccordionSummary
                                    expandIcon={<><i className={`fas fa-chevron-down ${classes.icon}`}></i></>}
                                >
                                    <div className={classes.iconWrapper}>
                                       <i className={`${classes.icon} ${group.icon}`} />
                                    </div>
                                    <h4 className={classes.accordionHeading}>
                                       {}
                                       {Array.from(group.groupName)[0].toUpperCase() + group.groupName.slice(1)}
                                    </h4>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {group.items.length > 0 && group.items.map((item) => (
                                        <a key={item.title} className={`${classes.link} ${location.hash == `#${item.path}` ? 'selected' : ''}`} href={`#${item.path}`}>
                                          {item.title}
                                       </a>
                                    ))}
                                </AccordionDetails>
                            </Accordion>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SidebarNav